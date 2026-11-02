
import {
  createAcademicSession,
  listAcademicSessions,
  getAcademicSessionById,
  updateAcademicSession,
  setCurrentAcademicSession,
} from "../services/academicSessionService.js";

import {
  listAcademicSessionsQuerySchema,
} from "../schemas/academicSessionSchema.js";

export async function createSession(req, res, next) {
  try {
    const session = await createAcademicSession(
      req.validatedBody
    );

    return res.status(201).json({
      success: true,
      message: "Academic session created successfully",
      data: session,
    });
  } catch (error) {
    next(error);
  }
}

export async function listSessions(req, res, next) {
  try {
    const parsed = listAcademicSessionsQuerySchema.safeParse(
      req.query
    );

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

    const result = await listAcademicSessions(parsed.data);

    return res.status(200).json({
      success: true,
      message: "Academic sessions retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getSession(req, res, next) {
  try {
    const session = await getAcademicSessionById(
      req.params.id
    );

    return res.status(200).json({
      success: true,
      message: "Academic session retrieved successfully",
      data: session,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateSession(req, res, next) {
  try {
    const session = await updateAcademicSession(
      req.params.id,
      req.validatedBody
    );

    return res.status(200).json({
      success: true,
      message: "Academic session updated successfully",
      data: session,
    });
  } catch (error) {
    next(error);
  }
}

export async function setCurrentSession(req, res, next) {
  try {
    const session = await setCurrentAcademicSession(
      req.params.id
    );

    return res.status(200).json({
      success: true,
      message: "Current academic session updated successfully",
      data: session,
    });
  } catch (error) {
    next(error);
  }
}
