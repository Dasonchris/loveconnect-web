const mongoose = require("mongoose");

if (!mongoose.Types.ObjectId.isValid(receiverId)) {
  return res.status(400).json({
    message: "Invalid receiver ID",
  });
}