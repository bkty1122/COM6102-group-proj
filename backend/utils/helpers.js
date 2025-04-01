// utils/helpers.js
const { v4: uuidv4 } = require('uuid');

const generateQuestionBankId = () => {
  return uuidv4();
};

const getCurrentTimestamp = () => {
  return new Date().toISOString();
};

const serializeOptions = (options) => {
  return JSON.stringify(options);
};

const deserializeOptions = (optionsString) => {
  try {
    return JSON.parse(optionsString);
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateQuestionBankId,
  getCurrentTimestamp,
  serializeOptions,
  deserializeOptions
};