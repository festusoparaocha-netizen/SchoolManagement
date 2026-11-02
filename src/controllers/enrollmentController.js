import {
  createEnrollment,
  listEnrollments,
  getEnrollmentById,
  updateEnrollment,
} from "../services/enrollmentService.js";

import {
  listEnrollmentsQuerySchema,
} from "../schemas/enrollmentSchema.js";

export async function createEnrollmentController(req, res, next) {
  try {
    const enrollment = await createEnrollment(req.validatedBody);

    return res.status(201).json({
      success: true,
      message: "Student enrolled successfully",
      data: enrollment,
    });
  } catch (error) {
    next(error);
  }
}

export async function listEnrollmentsController(req, res, next) {
  try {
    const parsed = listEnrollmentsQuerySchema.safeParse(req.query);

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

    const result = await listEnrollments(parsed.data);

    return res.status(200).json({
      success: true,
      message: "Enrollments retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getEnrollmentController(req, res, next) {
  try {
    const enrollment = await getEnrollmentById(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Enrollment retrieved successfully",
      data: enrollment,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateEnrollmentController(req, res, next) {
  try {
    const enrollment = await updateEnrollment(
      req.params.id,
      req.validatedBody
    );

    return res.status(200).json({
      success: true,
      message: "Enrollment updated successfully",
      data: enrollment,
    });
  } catch (error) {
    next(error);
  }
}