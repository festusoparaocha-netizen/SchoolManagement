
import {
  createStudent,
  listStudents,
  getStudentById,
  updateStudent,
  deactivateStudent
} from "../services/studentService.js";

export async function createStudentController(req, res, next) {
  try {
    const student = await createStudent(req.validatedBody);
    return res.status(201).json({
      success: true,
      message: "Student created successfully",
      data: { student }
    });
  } catch (error) {
    next(error);
  }
}

export async function listStudentsController(req, res, next) {
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

    const result = await listStudents({ page, limit, search, status });

    return res.status(200).json({
      success: true,
      message: "Students retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function getStudentController(req, res, next) {
  try {
    const student = await getStudentById(req.params.id);
    return res.status(200).json({
      success: true,
      message: "Student retrieved successfully",
      data: { student }
    });
  } catch (error) {
    next(error);
  }
}

export async function updateStudentController(req, res, next) {
  try {
    const student = await updateStudent(req.params.id, req.validatedBody);
    return res.status(200).json({
      success: true,
      message: "Student updated successfully",
      data: { student }
    });
  } catch (error) {
    next(error);
  }
}

export async function deactivateStudentController(req, res, next) {
  try {
    const student = await deactivateStudent(req.params.id);
    return res.status(200).json({
      success: true,
      message: "Student deactivated successfully",
      data: { student }
    });
  } catch (error) {
    next(error);
  }
}
