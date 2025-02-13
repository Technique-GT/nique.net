import mongoose, { Document, Schema, Model } from "mongoose";

interface IUser extends Document {
  email: string;
  password: string;
  username: string;
  firstName: string;
  lastName: string;
}


const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/^.+@.+\..+$/, "Please fill a valid email address"], // regex to validate email format
  },
  password: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
});

userSchema.index({
  username: "text",
  firstName: "text",
  lastName: "text",
});

const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);

export default User;
