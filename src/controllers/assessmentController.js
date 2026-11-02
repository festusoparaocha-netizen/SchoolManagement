import {
  createAssessment,
  listAssessments,
  getAssessmentById,
  updateAssessment,
} from "../services/assessmentService.js";

import {
  listAssessmentsQuerySchema,
} from "../schemas/assessmentSchema.js";

export async function createAssessmentController(req, res, next) {
  try {
    const assessment = await createAssessment(
      req.validatedBody,
      req.user
    );

    return res.status(201).json({
      success: true,
      message: "Assessment created successfully",
      data: assessment,
    });
  } catch (error) {
    next(error);
  }
}

export async function listAssessmentsController(req, res, next) {
  try {
    const parsed = listAssessmentsQuerySchema.safeParse(req.query);

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

    const result = await listAssessments(parsed.data, req.user);

    return res.status(200).json({
      success: true,
      message: "Assessments retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAssessmentController(req, res, next) {
  try {
    const assessment = await getAssessmentById(
      req.params.id,
      req.user
    );

    return res.status(200).json({
      success: true,
      message: "Assessment retrieved successfully",
      data: assessment,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAssessmentController(req, res, next) {
  try {
    const assessment = await updateAssessment(
      req.params.id,
      req.validatedBody,
      req.user
    );

    return res.status(200).json({
      success: true,
      message: "Assessment updated successfully",
      data: assessment,
    });
  } catch (error) {
    next(error);
  }
}