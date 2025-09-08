import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    senderId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    },
    receiverId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    },
    text: { 
        type: String, 
        default: "" 
    },
    image: { 
        type: String, 
        default: null 
    },
    seen: { 
        type: Boolean, 
        default: false 
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Add indexes for better performance
messageSchema.index({ senderId: 1, receiverId: 1 });
messageSchema.index({ createdAt: 1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;