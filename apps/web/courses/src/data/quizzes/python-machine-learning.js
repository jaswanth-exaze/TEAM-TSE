// TODO: expand this module with 10-15 in-depth questions (see mysql.js for the target format/depth)
export default [
  {
    id: 'python-machine-learning-1',
    type: 'mcq',
    difficulty: 'medium',
    prompt: "A model has 99% training accuracy but 60% test accuracy. What is this a classic sign of?",
    options: ["Overfitting","Underfitting","Data leakage prevention working correctly","Perfect generalization"],
    correctAnswer: "Overfitting",
    explanation: 'The large gap between training and test accuracy indicates overfitting: the model learned patterns specific to its training examples that do not generalize. Use a held-out validation strategy, regularization, or a simpler model, and check for data leakage.',
  },
  {
    id: 'python-machine-learning-2',
    type: 'mcq',
    difficulty: 'beginner',
    category: 'Data Splitting',
    prompt: 'Why should a test set remain separate until the final model evaluation?',
    options: ['Repeatedly tuning against it leaks information and makes its score optimistic', 'The test set must contain only training examples', 'Most models cannot predict rows that were not used for training', 'The test set is used to calculate gradients during every training step'],
    correctAnswer: 'Repeatedly tuning against it leaks information and makes its score optimistic',
    explanation: 'The test set estimates performance on unseen data. If model choices are repeatedly made based on test results, information from that set indirectly influences development and the estimate becomes biased. Use training data for fitting and validation data for model selection, then evaluate the test set at the end.'
  },
  {
    id: 'python-machine-learning-3',
    type: 'mcq',
    difficulty: 'hard',
    category: 'Preprocessing',
    prompt: 'A scaler is used before evaluating a model with cross-validation. Where should the scaler be fitted?',
    options: ['Fit it separately on each training fold, then transform that fold and its validation fold', 'Fit it once on the entire dataset before splitting', 'Fit it only on the validation fold', 'Fit it after calculating test accuracy'],
    correctAnswer: 'Fit it separately on each training fold, then transform that fold and its validation fold',
    explanation: 'Fitting preprocessing on all rows lets validation-fold statistics influence training, causing data leakage. A pipeline fits the scaler only on each fold’s training partition and applies those learned parameters to its validation partition.'
  },
]
