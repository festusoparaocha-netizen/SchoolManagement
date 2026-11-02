import {
  createAttendance,
  listAttendance,
  getAttendanceById,
  updateAttendance,
} from "../services/attendanceService.js";

import {
  listAttendanceQuerySchema,
} from "../schemas/attendanceSchema.js";

export async function createAttendanceController(req, res, next) {
  try {
    const attendance = await createAttendance(
      req.validatedBody,
      req.user
    );

    return res.status(201).json({
      success: true,
      message: "Attendance recorded successfully",
      data: attendance,
    });
  } catch (error) {
    next(error);
  }
}

export async function listAttendanceController(req, res, next) {
  try {
    const parsed = listAttendanceQuerySchema.safeParse(req.query);

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

    const result = await listAttendance(parsed.data, req.user);

    return res.status(200).json({
      success: true,
      message: "Attendance records retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAttendanceController(req, res, next) {
  try {
    const attendance = await getAttendanceById(
      req.params.id,
      req.user
    );

    return res.status(200).json({
      success: true,
      message: "Attendance record retrieved successfully",
      data: attendance,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAttendanceController(req, res, next) {
  try {
    const attendance = await updateAttendance(
      req.params.id,
      req.validatedBody,
      req.user
    );

    return res.status(200).json({
      success: true,
      message: "Attendance updated successfully",
      data: attendance,
    });
  } catch (error) {
    next(error);
  }
}