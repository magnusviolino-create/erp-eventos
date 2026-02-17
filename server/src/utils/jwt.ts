import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'default_secret';

export const generateToken = (payload: object): string => {
    return jwt.sign(payload, SECRET, { expiresIn: '1d' });
};

export const verifyToken = (token: string): any => {
    try {
        return jwt.verify(token, SECRET);
    } catch (error) {
        return null;
    }
};
