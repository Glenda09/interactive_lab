const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    simulation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Simulation',
      required: true,
    },
    score: { type: Number, min: 0, max: 100, required: true },
    completedAt: { type: Date, default: Date.now },
    durationSeconds: { type: Number },
    steps: [
      {
        stepId: String,
        success: Boolean,
        timeTakenSeconds: Number,
      },
    ],
    passed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Result', resultSchema);
