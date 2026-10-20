
import {
  createTeacher,
  listTeachers,
  getTeacherById,
  updateTeacher,
  deactivateTeacher
} from "../services/teacherService.js";

export async function createTeacherController(req, res, next) {
  try {
    const teacher = await createTeacher(req.validatedBody);

    return res.status(201).json({
      success: true,
      message: "Teacher created successfully",
      data: { teacher }
    });
  } catch (error) {
    next(error);
  }
}

export async function listTeachersController(req, res, next) {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);
    const search = req.query.search?.trim();
    const status = req.query.status ?? "ACTIVE";

    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100 ||
      !["ACTIVE", "INACTIVE", "SUSPENDED", "ALL"].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid pagination or status parameters",
        data: null
      });
    }

    const result = await listTeachers({ page, limit, search, status });

    return res.status(200).json({
      success: true,
      message: "Teachers retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function getTeacherController(req, res, next) {
  try {
    const teacher = await getTeacherById(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Teacher retrieved successfully",
      data: { teacher }
    });
  } catch (error) {
    next(error);
  }
}

export async function updateTeacherController(req, res, next) {
  try {
    const teacher = await updateTeacher(
      req.params.id,
      req.validatedBody
    );

    return res.status(200).json({
      success: true,
      message: "Teacher updated successfully",
      data: { teacher }
    });
  } catch (error) {
    next(error);
  }
}

export async function deactivateTeacherController(req, res, next) {
  try {
    const teacher = await deactivateTeacher(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Teacher deactivated successfully",
      data: { teacher }
    });
  } catch (error) {
    next(error);
  }
}
