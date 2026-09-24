 export default roleAuthorize = (...currentRole) => {
    return (req, res, next) => {
        if (!req?.user?.role) {
            return res.sendStatus(401);
        }

        const allowedRoles = [...currentRole];

        const result = req.user.role.map(ro => allowedRoles.includes(ro)).find(one => one === true);
        if (!result) {
            return res.sendStatus(401);
        }

        next();
    }
}