import jwt from "jsonwebtoken";

const SECRET_KEY:any = process.env.SECRET_KEY ;

export const verifyToken = (token: string) => {
    if (!token) {
        throw new Error("Token is required for verification.");
    }
    return jwt.verify(token, SECRET_KEY); // Ensure SECRET_KEY is valid
};