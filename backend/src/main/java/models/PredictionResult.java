package models;

public class PredictionResult {
    private float probability;

    public PredictionResult(float probability) {
        this.probability = probability;
    }

    public float getProbability() {
        return probability;
    }

    public void setProbability(float probability) {
        this.probability = probability;
    }
}

