const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userGroupSchema = new Schema({
    name: [{ type: String, required: false }],
});

module.exports = mongoose.model('UserGroup', userGroupSchema);