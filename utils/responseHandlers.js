import mongoose from "mongoose";

const handleNotFound = (res, modelName, id) => {
  console.log(`Did not find ${modelName} for id ${id}`)
  return res.status(404).json({
    success: false,
    message: `Did not find ${modelName} for id ${id}`,
  })
}

const handleAlreadyExists = (res, modelName, name) => {
  console.log(`Already existing ${modelName} for name ${name}`)
  return res.status(400).json({
    success: false,
    message: `Already existing ${modelName} for name ${name}`,
  })
}

const handleErrorResponse = (res, error, msg = 'Internal Server Error') => {
  return res.status(500).json({
    success: false,
    error: error?.message ?? "Internal server error",
    msg
  })
}

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const validateUserId = (userID, res) => {
  if (!isValidObjectId(userID)) {
    res.status(400).json({
      success: false,
      message: "Invalid userID format",
    });
    return false;
  }
  return true;
};

export { handleAlreadyExists, handleErrorResponse, handleNotFound, isValidObjectId, validateUserId };