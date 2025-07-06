const mongoose = require('mongoose');

const connectedWorkspaceSchema = new mongoose.Schema({
  workspaceLink: { 
    type: String, 
    required: true 
  },
  ownerId: { 
    type: String, 
    required: true 
  },
  
chatMateUsername: {
  type: String,
  required: true
}
}, {
  timestamps: true // Adds createdAt and updatedAt fields automatically
});

const ConnectedWorkspace = mongoose.model('ConnectedWorkspace', connectedWorkspaceSchema);

module.exports = ConnectedWorkspace; 