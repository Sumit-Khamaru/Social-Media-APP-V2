import mongoose from "mongoose";

export const connectDataBase = () => {
    mongoose.set('strictQuery', true)
  mongoose
    .connect(process.env.MONGO_URI)
    .then((con) =>
      console.log(`DataBase is Connected: ${con.connection.host}`))
      .catch((err) => console.log(err));
};
