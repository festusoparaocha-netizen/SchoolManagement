
import {
  createClass,
  listClasses,
  getClassById,
  updateClass,
  deactivateClass
} from "../services/classService.js";

export async function createClassController(req, res, next) {
  try {
    const schoolClass = await createClass(req.validatedBody);

    return res.status(201).json({
      success: true,
      message: "Class created successfully",
      data: { schoolClass }
    });
  } catch (error) {
    next(error);
  }
}

export async function listClassesController(req, res, next) {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);
    const search = req.query.search?.trim();
    const status = req.query.status ?? "ACTIVE";

    if (
      !Number.isInteger(page) || page < 1 ||
      !Number.isInteger(limit) || limit < 1 || limit > 100 ||
      !["ACTIVE", "INACTIVE", "SUSPENDED", "ALL"].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid pagination or status parameters",
        data: null
      });
    }

    const result = await listClasses({ page, limit, search, status });

    return res.status(200).json({
      success: true,
      message: "Classes retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function getClassController(req, res, next) {
  try {
    const schoolClass = await getClassById(req.validatedParams.id);

    return res.status(200).json({
      success: true,
      message: "Class retrieved successfully",
      data: { schoolClass }
    });
  } catch (error) {
    next(error);
  }
}

export async function updateClassController(req, res, next) {
  try {
    const schoolClass = await updateClass(
      req.validatedParams.id,
      req.validatedBody
    );

    return res.status(200).json({
      success: true,
      message: "Class updated successfully",
      data: { schoolClass }
    });
  } catch (error) {
    next(error);
  }
}

export async function deactivateClassController(req, res, next) {
  try {
    const schoolClass = await deactivateClass(req.validatedParams.id);

    return res.status(200).json({
      success: true,
      message: "Class deactivated successfully",
      data: { schoolClass }
    });
  } catch (error) {
    next(error);
  }
}
