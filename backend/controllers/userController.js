import User from "../models/User.js";
import UserSchool from "../models/UserSchool.js";
import LeaveCredit from "../models/LeaveCredit.js";

const getIdString = (value) => {
  if (!value) return "";
  if (value._id) return String(value._id);
  return String(value);
};

const getDefaultCredits = (personnelType) => {
  if (personnelType === "teaching") {
    return [
      {
        leaveType: "vacation_service_credit",
        earned: 0,
        used: 0,
      },
    ];
  }

  return [
    {
      leaveType: "vacation_leave",
      earned: 0,
      used: 0,
    },
    {
      leaveType: "sick_leave",
      earned: 0,
      used: 0,
    },
    {
      leaveType: "special_privilege_leave",
      earned: 0,
      used: 0,
    },
    {
      leaveType: "force_leave",
      earned: 0,
      used: 0,
    },
  ];
};

const getScopedSchoolQuery = (req) => {
  if (req.isDivisionAdmin) return {};
  return { school: getIdString(req.userSchool.school) };
};

export const createSchoolUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      employeeNumber,
      role,
      personnelType,
      position,
      employmentStatus,
      dateHired,
    } = req.body;

    if (!["admin_officer", "principal", "teacher"].includes(role)) {
      return res.status(400).json({
        message:
          "Invalid role. School Admin can only create Admin Officer, Principal, or Teacher accounts.",
      });
    }

    if (req.isDivisionAdmin) {
      return res.status(403).json({
        message:
          "Division Admin account creation for school users requires a school selector. Please use a school-based Admin Officer account for now.",
      });
    }

    const schoolId = getIdString(req.userSchool.school);

    let finalPersonnelType = personnelType;

    if (role === "principal" || role === "admin_officer") {
      finalPersonnelType = "non_teaching";
    }

    if (role === "teacher") {
      finalPersonnelType = "teaching";
    }

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        password,
      });
    }

    const existingMembership = await UserSchool.findOne({
      user: user._id,
      school: schoolId,
    });

    if (existingMembership) {
      return res.status(400).json({
        message: "User already belongs to this school.",
      });
    }

    const duplicateEmployeeNumber = await UserSchool.findOne({
      school: schoolId,
      employeeNumber,
    });

    if (duplicateEmployeeNumber) {
      return res.status(400).json({
        message: "Employee number already exists in this school.",
      });
    }

    const userSchool = await UserSchool.create({
      user: user._id,
      school: schoolId,
      employeeNumber,
      role,
      personnelType: finalPersonnelType,
      position,
      employmentStatus,
      dateHired,
    });

    await LeaveCredit.create({
      userSchool: userSchool._id,
      credits: getDefaultCredits(finalPersonnelType),
    });

    return res.status(201).json({
      message: "User created successfully.",
      user,
      userSchool,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const getSchoolUsers = async (req, res) => {
  try {
    const query = {
      ...getScopedSchoolQuery(req),
      isActive: true,
    };

    const users = await UserSchool.find(query)
      .populate("user", "-password")
      .populate("school")
      .sort({ school: 1, role: 1, createdAt: -1 });

    return res.json(users);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const updateSchoolUser = async (req, res) => {
  try {
    const {
      employeeNumber,
      role,
      personnelType,
      position,
      employmentStatus,
      dateHired,
    } = req.body;

    const query = {
      _id: req.params.id,
      ...getScopedSchoolQuery(req),
    };

    const userSchool = await UserSchool.findOne(query);

    if (!userSchool) {
      return res.status(404).json({
        message: "User membership not found.",
      });
    }

    if (role && !["admin_officer", "principal", "teacher"].includes(role)) {
      return res.status(400).json({
        message: "Invalid role for a school user.",
      });
    }

    let finalPersonnelType = personnelType;

    if (role === "principal" || role === "admin_officer") {
      finalPersonnelType = "non_teaching";
    }

    if (role === "teacher") {
      finalPersonnelType = "teaching";
    }

    if (employeeNumber) userSchool.employeeNumber = employeeNumber;
    if (role) userSchool.role = role;
    if (finalPersonnelType) userSchool.personnelType = finalPersonnelType;
    if (position) userSchool.position = position;
    if (employmentStatus) userSchool.employmentStatus = employmentStatus;
    if (dateHired) userSchool.dateHired = dateHired;

    await userSchool.save();

    return res.json({
      message: "User updated successfully.",
      userSchool,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const deactivateSchoolUser = async (req, res) => {
  try {
    const query = {
      _id: req.params.id,
      ...getScopedSchoolQuery(req),
    };

    const userSchool = await UserSchool.findOne(query);

    if (!userSchool) {
      return res.status(404).json({
        message: "User membership not found.",
      });
    }

    userSchool.isActive = false;
    await userSchool.save();

    return res.json({
      message: "User deactivated successfully.",
      userSchool,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const activateSchoolUser = async (req, res) => {
  try {
    const query = {
      _id: req.params.id,
      ...getScopedSchoolQuery(req),
    };

    const userSchool = await UserSchool.findOne(query);

    if (!userSchool) {
      return res.status(404).json({
        message: "User membership not found.",
      });
    }

    userSchool.isActive = true;
    await userSchool.save();

    return res.json({
      message: "User activated successfully.",
      userSchool,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const resetUserPassword = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters.",
      });
    }

    const query = {
      _id: req.params.id,
      ...getScopedSchoolQuery(req),
    };

    const userSchool = await UserSchool.findOne(query);

    if (!userSchool) {
      return res.status(404).json({
        message: "User membership not found.",
      });
    }

    const user = await User.findById(userSchool.user);

    if (!user) {
      return res.status(404).json({
        message: "User account not found.",
      });
    }

    user.password = password;
    await user.save();

    return res.json({
      message: "Temporary password saved successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const getInactiveSchoolUsers = async (req, res) => {
  try {
    const query = {
      ...getScopedSchoolQuery(req),
      isActive: false,
    };

    const users = await UserSchool.find(query)
      .populate("user", "-password")
      .populate("school")
      .sort({ school: 1, role: 1, createdAt: -1 });

    return res.json(users);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};