import { AppError, throwIfNotFound } from "../../errors/errors.js";
import withTransaction from "../../utils/transaction.util.js";
import { findUserByEmail, findUserById } from "../auth/auth.repo.js";
import * as usersRepo from "../users/repo.users.js";
import bcrypt from "bcrypt";

//Update user profile
const updateUser = (userId, data) => {
    return withTransaction(async(client) => {
        const {name, email, password} = data;
        const user = await findUserById(userId, {db: client});


        let params = [];
        let values = [];
        let index = 2;

        if (email) {
            const findEmail = await findUserByEmail(email, {db: client});

            if (email === user.email ) {
                throw AppError("Can't update email with current email", 409);
            }

            if (findEmail) {
                throw AppError("Email already taken", 409);
            }

            params.push(`email = $${index++}`);
            values.push(email);
        }

        if (name) {
            if (name === user.name) {
                throw AppError("Please add new name", 422);
            }
            params.push(`name = $${index++}`);
            values.push(name);
        }

        if (password && user.password != null) {
            const newPassword = await bcrypt.hash(password, 10);
            params.push(`password = $${index++}`);
            values.push(newPassword);
        }

        if (params.length > 0) {
            params.push(`updated_at = $${index++}`);
            values.push(new Date());
            var result = await usersRepo.updateUser(params, values, user.id, {db: client});
        }else{
            throw AppError("Update at least an attribute", 422);
        }

        return {
            message: "Profile updated seccessfully",
            data: result
        }
    });
}

//Get user profile
const viewProfile = async (userId) => {
    const data = await findUserById(userId);
    throwIfNotFound(data, "User not found");
    console.log(userId)

    const profile = {
        name: data.name,
        email: data.email,
        created_at: data.created_at
    }

    return {
        data: profile
    }
}

export {
    updateUser,
    viewProfile
}