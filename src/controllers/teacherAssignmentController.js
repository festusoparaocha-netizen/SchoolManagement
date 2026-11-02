import {
  createTeacherAssignment,
  listTeacherAssignments,
  getTeacherAssignmentById,
  updateTeacherAssignment,
  deleteTeacherAssignment,
} from "../services/teacherAssignmentService.js";

import {
  listTeacherAssignmentsQuerySchema,
} from "../schemas/teacherAssignmentSchema.js";

export async function createAssignment(req, res, next) {
  try {
    const assignment = await createTeacherAssignment(req.validatedBody);

    return res.status(201).json({
      success: true,
      message: "Teacher assignment created successfully",
      data: assignment,
    });
  } catch (error) {
    next(error);
  }
}

export async function listAssignments(req, res, next) {
  try {
    const parsed = listTeacherAssignmentsQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid query parameters",
        data: {
          errors: parsed.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
      });
    }

    const result = await listTeacherAssignments(parsed.data);

    return res.status(200).json({
      success: true,
      message: "Teacher assignments retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAssignment(req, res, next) {
  try {
    const assignment = await getTeacherAssignmentById(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Teacher assignment retrieved successfully",
      data: assignment,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAssignment(req, res, next) {
  try {
    const assignment = await updateTeacherAssignment(
      req.params.id,
      req.validatedBody
    );

    return res.status(200).json({
      success: true,
      message: "Teacher assignment updated successfully",
      data: assignment,
    });
  } catch (error) {
    next(error);
  }
}

export async function removeAssignment(req, res, next) {
  try {
    await deleteTeacherAssignment(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Teacher assignment deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}