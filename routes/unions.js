const express = require("express");
const router = express.Router();
const { verifyToken, verifyAdmin } = require("../middleware/verifyToken");

const {
    getUnions,
    getUnion,
    createUnion,
    updateUnion,
    deleteUnion,
    getUnionsInRadius,
    getToken,
} = require("../controllers/union");

// router.route("/all").get(getAllUnions);

router.route("/gettoken").get(getToken);
router.route("/radius/:zipcode/:distance").get(verifyToken, getUnionsInRadius);

router.route("/").get(verifyToken, getUnions).post(verifyAdmin, createUnion);
router
    .route("/:id")
    .get(verifyToken, getUnion)
    .put(verifyAdmin, updateUnion)
    .delete(verifyAdmin, deleteUnion);

module.exports = router;
