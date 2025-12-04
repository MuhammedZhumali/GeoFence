package service;

import jakarta.annotation.PreDestroy;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.tensorflow.SavedModelBundle;
import org.tensorflow.Tensor;
import org.tensorflow.ndarray.Shape;
import org.tensorflow.ndarray.buffer.DataBuffers;
import org.tensorflow.types.TFloat32;

import java.io.File;
import java.io.IOException;

@Service
public class MlInferenceService {
    private final SavedModelBundle model;

    public MlInferenceService() throws IOException {
        // Try multiple possible paths
        String[] possiblePaths = {
            "exported_geofence_model",  // Docker/current directory
            "/app/exported_geofence_model",  // Docker absolute path
            "src/main/resources/exported_geofence_model",  // Local development
            System.getProperty("user.dir") + "/src/main/resources/exported_geofence_model"  // Absolute local path
        };
        
        String modelPath = null;
        for (String path : possiblePaths) {
            File modelDir = new File(path);
            if (modelDir.exists() && modelDir.isDirectory()) {
                File savedModel = new File(modelDir, "saved_model.pb");
                if (savedModel.exists()) {
                    modelPath = path;
                    break;
                }
            }
        }
        
        if (modelPath == null) {
            // Last resort: try to extract from classpath
            try {
                ClassPathResource resource = new ClassPathResource("exported_geofence_model");
                if (resource.exists() && resource.isFile()) {
                    // It's a file system resource (not in JAR)
                    modelPath = resource.getFile().getAbsolutePath();
                } else {
                    throw new IOException("Model not found. Tried paths: " + String.join(", ", possiblePaths));
                }
            } catch (Exception e) {
                throw new IOException("Model not found. Tried paths: " + String.join(", ", possiblePaths) + ". Error: " + e.getMessage());
            }
        }
        
        this.model = SavedModelBundle.load(modelPath, "serve");
    }

    public float predict(float[][] window) {

        if (window.length != 20 || window[0].length != 2) {
            throw new IllegalArgumentException("Input must be shape (20,2)");
        }


        // Create a 3D array [1, 20, 2]
        float[][][] input = new float[1][20][2];
        input[0] = window;

        // Flatten the array for the buffer
        float[] flatInput = new float[1 * 20 * 2];
        int idx = 0;
        for (int i = 0; i < 1; i++) {
            for (int j = 0; j < 20; j++) {
                for (int k = 0; k < 2; k++) {
                    flatInput[idx++] = input[i][j][k];
                }
            }
        }

        // Create tensor using the new API
        TFloat32 inputTensor = TFloat32.tensorOf(
            Shape.of(1, 20, 2),
            DataBuffers.of(flatInput)
        );

        try {
            Tensor output = model.session().runner()
                .feed("serve_trajectory_window", inputTensor)
                .fetch("StatefulPartitionedCall:0")
                .run()
                .get(0);

            // Extract the float value from the output tensor
            // The output has shape (1, 1) - 2D tensor [batch, output_dim]
            // We need to read it as a float array and get the first (and only) value
            float[] result = new float[1];
            output.asRawTensor().data().asFloats().read(result);
            return result[0];
        } finally {
            inputTensor.close();
        }
    }
    
    @PreDestroy
    public void close() {
        model.close();
    }

}