import { useEffect, useMemo, useState } from "react";
import { Button, Card, Tooltip } from "@heroui/react";
import {
  ExclamationTriangleIcon,
  KeyIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
  UserGroupIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import {
  activateUser,
  createUser,
  deactivateUser,
  getInactiveUsers,
  getUsers,
  resetUserPassword,
  updateUser,
} from "../services/userService";

const formatDate = (date) => {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatLabel = (value) => {
  if (!value) return "-";
  return value.replaceAll("_", " ");
};

const initialForm = {
  name: "",
  email: "",
  password: "Password123",
  employeeNumber: "",
  role: "teacher",
  personnelType: "teaching",
  position: "",
  employmentStatus: "permanent",
  dateHired: "",
};

const initialPasswordForm = {
  password: "Password123",
};

const roleOptions = [
  { label: "Teacher", value: "teacher" },
  { label: "Principal", value: "principal" },
  { label: "Admin Officer", value: "admin_officer" },
];

const personnelTypeOptions = [
  { label: "Teaching", value: "teaching" },
  { label: "Non-Teaching", value: "non_teaching" },
];

const employmentStatusOptions = [
  { label: "Permanent", value: "permanent" },
  { label: "Provisional", value: "provisional" },
  { label: "Contractual", value: "contractual" },
  { label: "Job Order", value: "job_order" },
  { label: "Substitute", value: "substitute" },
];

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [inactiveUsers, setInactiveUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [resettingEmployee, setResettingEmployee] = useState(null);

  const [form, setForm] = useState(initialForm);
  const [passwordForm, setPasswordForm] = useState(initialPasswordForm);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [pageError, setPageError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const employeeStats = useMemo(() => {
    const allEmployees = [...users, ...inactiveUsers];

    const total = allEmployees.length;
    const active = users.length;
    const inactive = inactiveUsers.length;

    const teachers = allEmployees.filter(
      (employee) => employee.role === "teacher"
    ).length;

    return { total, active, inactive, teachers };
  }, [users, inactiveUsers]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setPageError("");

      const [activeData, inactiveData] = await Promise.all([
        getUsers(),
        getInactiveUsers(),
      ]);

      setUsers(activeData);
      setInactiveUsers(inactiveData);
    } catch (err) {
      setPageError(err.message || "Failed to load employees.");
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (field, value) => {
    setForm((current) => {
      const updated = {
        ...current,
        [field]: value,
      };

      if (field === "role") {
        if (value === "teacher") {
          updated.personnelType = "teaching";
        }

        if (value === "principal" || value === "admin_officer") {
          updated.personnelType = "non_teaching";
        }
      }

      return updated;
    });
  };

  const openAddDrawer = () => {
    setForm(initialForm);
    setError("");
    setSuccessMessage("");
    setIsAddDrawerOpen(true);
  };

  const closeAddDrawer = () => {
    setIsAddDrawerOpen(false);
    setError("");
  };

  const openEditDrawer = (employee) => {
    setEditingEmployee(employee);
    setForm({
      name: employee.user?.name || "",
      email: employee.user?.email || "",
      password: "",
      employeeNumber: employee.employeeNumber || "",
      role: employee.role || "teacher",
      personnelType: employee.personnelType || "teaching",
      position: employee.position || "",
      employmentStatus: employee.employmentStatus || "permanent",
      dateHired: employee.dateHired ? employee.dateHired.slice(0, 10) : "",
    });
    setError("");
    setSuccessMessage("");
  };

  const closeEditDrawer = () => {
    setEditingEmployee(null);
    setError("");
  };

  const openResetPasswordDrawer = (employee) => {
    setResettingEmployee(employee);
    setPasswordForm(initialPasswordForm);
    setError("");
    setSuccessMessage("");
  };

  const closeResetPasswordDrawer = () => {
    setResettingEmployee(null);
    setPasswordForm(initialPasswordForm);
    setError("");
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      await createUser(form);
      await loadUsers();

      closeAddDrawer();
      setSuccessMessage("Employee account created successfully.");
    } catch (err) {
      setError(err.message || "Failed to create employee.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      await updateUser(editingEmployee._id, {
        employeeNumber: form.employeeNumber,
        role: form.role,
        personnelType: form.personnelType,
        position: form.position,
        employmentStatus: form.employmentStatus,
        dateHired: form.dateHired,
      });

      await loadUsers();

      closeEditDrawer();
      setSuccessMessage("Employee record updated successfully.");
    } catch (err) {
      setError(err.message || "Failed to update employee.");
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      await resetUserPassword(resettingEmployee._id, {
        password: passwordForm.password,
      });

      closeResetPasswordDrawer();
      setSuccessMessage("Temporary password saved successfully.");
    } catch (err) {
      setError(err.message || "Failed to reset password.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (employee) => {
    const confirmed = window.confirm(
      `Deactivate ${employee.user?.name}? They will no longer be active in this school.`
    );

    if (!confirmed) return;

    try {
      setPageError("");
      setSuccessMessage("");

      await deactivateUser(employee._id);
      await loadUsers();

      setSuccessMessage("Employee deactivated successfully.");
    } catch (err) {
      setPageError(err.message || "Failed to deactivate employee.");
    }
  };

  const handleActivate = async (employee) => {
    const confirmed = window.confirm(
      `Activate ${employee.user?.name}? They will become active in this school again.`
    );

    if (!confirmed) return;

    try {
      setPageError("");
      setSuccessMessage("");

      await activateUser(employee._id);
      await loadUsers();

      setSuccessMessage("Employee activated successfully.");
    } catch (err) {
      setPageError(err.message || "Failed to activate employee.");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-28 animate-pulse rounded-3xl bg-slate-200" />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="h-28 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-28 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-28 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-28 animate-pulse rounded-2xl bg-slate-200" />
        </div>

        <div className="h-96 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-linear-to-br from-sky-600 via-sky-500 to-cyan-400 p-6 text-white shadow-sm">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-100">
              Employee Management
            </p>

            <h1 className="mt-2 text-3xl font-bold">Employees</h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-sky-50">
              Manage school personnel, employee profiles, user roles, and
              temporary password access.
            </p>
          </div>

          <Button
            color="primary"
            onPress={openAddDrawer}
            className="h-11 gap-2 bg-white font-semibold text-sky-700"
          >
            <PlusIcon className="h-5 w-5" />
            Add Employee
          </Button>
        </div>
      </section>

      {pageError && <ErrorBox message={pageError} />}

      {successMessage && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard
          label="Total Employees"
          value={employeeStats.total}
          helper="All employee records"
          tone="slate"
        />

        <StatCard
          label="Active"
          value={employeeStats.active}
          helper="Currently active"
          tone="green"
        />

        <StatCard
          label="Inactive"
          value={employeeStats.inactive}
          helper="Deactivated records"
          tone="red"
        />

        <StatCard
          label="Teachers"
          value={employeeStats.teachers}
          helper="Teaching personnel"
          tone="sky"
        />
      </section>

      <Card className="border border-slate-200 bg-white shadow-sm">
        <Card.Content className="p-0">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-200 p-5 md:flex-row md:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                <UserGroupIcon className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">Employee Records</h2>
                <p className="text-sm text-slate-500">
                  View, update, reset password, or deactivate employees.
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
              {users.length} record(s)
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-237.5">
              <thead className="bg-slate-50">
                <tr>
                  <TableHeader>Employee</TableHeader>
                  <TableHeader>Employee No.</TableHeader>
                  <TableHeader>Role</TableHeader>
                  <TableHeader>Personnel Type</TableHeader>
                  <TableHeader>Position</TableHeader>
                  <TableHeader>Date Hired</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader align="right">Actions</TableHeader>
                </tr>
              </thead>

              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-4 py-10 text-center text-sm text-slate-500"
                    >
                      No employee records found.
                    </td>
                  </tr>
                ) : (
                  users.map((employee) => (
                    <tr
                      key={employee._id}
                      className="border-t border-slate-200 transition hover:bg-slate-50"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">
                            {getInitials(employee.user?.name)}
                          </div>

                          <div>
                            <p className="font-semibold text-slate-900">
                              {employee.user?.name || "Employee"}
                            </p>
                            <p className="text-sm text-slate-500">
                              {employee.user?.email || "-"}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>{employee.employeeNumber || "-"}</TableCell>

                      <TableCell>
                        <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold capitalize text-sky-700">
                          {formatLabel(employee.role)}
                        </span>
                      </TableCell>

                      <TableCell capitalize>
                        {formatLabel(employee.personnelType)}
                      </TableCell>

                      <TableCell muted>{employee.position || "-"}</TableCell>

                      <TableCell muted>
                        {formatDate(employee.dateHired)}
                      </TableCell>

                      <TableCell>
                        {employee.isActive ? (
                          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                            Active
                          </span>
                        ) : (
                          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                            Inactive
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Tooltip content="Edit employee">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              color="primary"
                              onPress={() => openEditDrawer(employee)}
                            >
                              <PencilSquareIcon className="h-5 w-5" />
                            </Button>
                          </Tooltip>

                          <Tooltip content="Reset temporary password">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              color="warning"
                              onPress={() => openResetPasswordDrawer(employee)}
                            >
                              <KeyIcon className="h-5 w-5" />
                            </Button>
                          </Tooltip>

                          {employee.isActive && (
                            <Tooltip content="Deactivate employee">
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                color="danger"
                                onPress={() => handleDeactivate(employee)}
                              >
                                <TrashIcon className="h-5 w-5" />
                              </Button>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card.Content>
      </Card>

      <Card className="border border-slate-200 bg-white shadow-sm">
        <Card.Content className="p-0">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-200 p-5 md:flex-row md:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-700">
                <UserGroupIcon className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  Deactivated Employees
                </h2>

                <p className="text-sm text-slate-500">
                  Employees who are currently inactive in this school.
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
              {inactiveUsers.length} record(s)
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-237.5">
              <thead className="bg-slate-50">
                <tr>
                  <TableHeader>Employee</TableHeader>
                  <TableHeader>Employee No.</TableHeader>
                  <TableHeader>Role</TableHeader>
                  <TableHeader>Personnel Type</TableHeader>
                  <TableHeader>Position</TableHeader>
                  <TableHeader>Date Hired</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader align="right">Actions</TableHeader>
                </tr>
              </thead>

              <tbody>
                {inactiveUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-4 py-10 text-center text-sm text-slate-500"
                    >
                      No deactivated employees.
                    </td>
                  </tr>
                ) : (
                  inactiveUsers.map((employee) => (
                    <tr
                      key={employee._id}
                      className="border-t border-slate-200 transition hover:bg-slate-50"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">
                            {getInitials(employee.user?.name)}
                          </div>

                          <div>
                            <p className="font-semibold text-slate-900">
                              {employee.user?.name || "Employee"}
                            </p>

                            <p className="text-sm text-slate-500">
                              {employee.user?.email || "-"}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        {employee.employeeNumber || "-"}
                      </TableCell>

                      <TableCell>
                        <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold capitalize text-sky-700">
                          {formatLabel(employee.role)}
                        </span>
                      </TableCell>

                      <TableCell capitalize>
                        {formatLabel(employee.personnelType)}
                      </TableCell>

                      <TableCell muted>
                        {employee.position || "-"}
                      </TableCell>

                      <TableCell muted>
                        {formatDate(employee.dateHired)}
                      </TableCell>

                      <TableCell>
                        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                          Inactive
                        </span>
                      </TableCell>

                      <TableCell>
                        <div className="flex justify-end">
                          <Tooltip content="Activate employee">
                            <Button
                              size="sm"
                              variant="flat"
                              color="success"
                              onPress={() => handleActivate(employee)}
                            >
                              Activate
                            </Button>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card.Content>
      </Card>

      {isAddDrawerOpen && (
        <EmployeeDrawer
          title="Add Employee"
          subtitle="Create a school user account and leave credit record."
          form={form}
          error={error}
          saving={saving}
          onClose={closeAddDrawer}
          onSubmit={handleAddSubmit}
          updateForm={updateForm}
          showAccountFields
        />
      )}

      {editingEmployee && (
        <EmployeeDrawer
          title="Edit Employee"
          subtitle={editingEmployee.user?.name}
          form={form}
          error={error}
          saving={saving}
          onClose={closeEditDrawer}
          onSubmit={handleEditSubmit}
          updateForm={updateForm}
          showAccountFields={false}
        />
      )}

      {resettingEmployee && (
        <DrawerShell
          title="Reset Temporary Password"
          subtitle={resettingEmployee.user?.name}
        >
          <form onSubmit={handleResetPassword} className="space-y-5 p-6">
            {error && <ErrorBox message={error} />}

            <FormInput
              label="New Temporary Password"
              type="text"
              value={passwordForm.password}
              onChange={(value) => setPasswordForm({ password: value })}
              required
            />

            <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <ExclamationTriangleIcon className="h-5 w-5 shrink-0" />
              <p>
                Give this temporary password to the employee. Ask them to change
                it after logging in.
              </p>
            </div>

            <DrawerActions
              onCancel={closeResetPasswordDrawer}
              loading={saving}
              submitLabel="Save Password"
            />
          </form>
        </DrawerShell>
      )}
    </div>
  );
}

function EmployeeDrawer({
  title,
  subtitle,
  form,
  error,
  saving,
  onClose,
  onSubmit,
  updateForm,
  showAccountFields,
}) {
  const isRoleLockedToNonTeaching =
    form.role === "principal" || form.role === "admin_officer";

  return (
    <DrawerShell title={title} subtitle={subtitle}>
      <form onSubmit={onSubmit} className="space-y-5 p-6">
        {error && <ErrorBox message={error} />}

        {showAccountFields && (
          <>
            <SectionTitle
              title="Account Information"
              description="Login details for the employee account."
            />

            <FormInput
              label="Full Name"
              value={form.name}
              onChange={(value) => updateForm("name", value)}
              required
            />

            <FormInput
              label="Email"
              type="email"
              value={form.email}
              onChange={(value) => updateForm("email", value)}
              required
            />

            <FormInput
              label="Temporary Password"
              type="text"
              value={form.password}
              onChange={(value) => updateForm("password", value)}
              required
            />
          </>
        )}

        <SectionTitle
          title="Employment Information"
          description="School role and personnel profile."
        />

        <FormInput
          label="Employee Number"
          value={form.employeeNumber}
          onChange={(value) => updateForm("employeeNumber", value)}
          required
        />

        <FormSelect
          label="Role"
          value={form.role}
          onChange={(value) => updateForm("role", value)}
          options={roleOptions}
        />

        <FormSelect
          label="Personnel Type"
          value={form.personnelType}
          onChange={(value) => updateForm("personnelType", value)}
          options={personnelTypeOptions}
          disabled={isRoleLockedToNonTeaching}
          helper={
            isRoleLockedToNonTeaching
              ? "Principals and Admin Officers are treated as non-teaching personnel for leave credits."
              : ""
          }
        />

        <FormInput
          label="Position"
          value={form.position}
          onChange={(value) => updateForm("position", value)}
          placeholder="e.g. Teacher III, Administrative Officer V"
        />

        <FormSelect
          label="Employment Status"
          value={form.employmentStatus}
          onChange={(value) => updateForm("employmentStatus", value)}
          options={employmentStatusOptions}
        />

        <FormInput
          label="Date Hired"
          type="date"
          value={form.dateHired}
          onChange={(value) => updateForm("dateHired", value)}
        />

        <DrawerActions onCancel={onClose} loading={saving} submitLabel="Save" />
      </form>
    </DrawerShell>
  );
}

function StatCard({ label, value, helper, tone = "sky" }) {
  const tones = {
    sky: "bg-sky-100 text-sky-700",
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    slate: "bg-slate-100 text-slate-700",
  };

  return (
    <Card className="border border-slate-200 bg-white shadow-sm">
      <Card.Content className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
            <p className="mt-1 text-xs text-slate-400">{helper}</p>
          </div>

          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tones[tone]}`}
          >
            <UserIcon className="h-6 w-6" />
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}

function DrawerShell({ title, subtitle, children }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
      <div className="h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>

        {children}
      </div>
    </div>
  );
}

function DrawerActions({ onCancel, loading, submitLabel }) {
  return (
    <div className="flex gap-3 pt-4">
      <Button type="button" variant="flat" className="w-full" onPress={onCancel}>
        Cancel
      </Button>

      <Button
        type="submit"
        color="primary"
        isLoading={loading}
        className="w-full bg-sky-600 font-semibold text-white"
      >
        {submitLabel}
      </Button>
    </div>
  );
}

function SectionTitle({ title, description }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function TableHeader({ children, align = "left" }) {
  return (
    <th
      className={`px-4 py-3 text-${align} text-xs font-bold uppercase tracking-wide text-slate-500`}
    >
      {children}
    </th>
  );
}

function TableCell({ children, muted = false, capitalize = false }) {
  return (
    <td
      className={`px-4 py-3 text-sm ${
        muted ? "text-slate-500" : "text-slate-700"
      } ${capitalize ? "capitalize" : ""}`}
    >
      {children}
    </td>
  );
}

function ErrorBox({ message }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  );
}

function FormInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  required = false,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
      />
    </div>
  );
}

function FormSelect({
  label,
  value,
  onChange,
  options,
  disabled = false,
  helper = "",
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-100 disabled:text-slate-500"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {helper && <p className="mt-2 text-xs text-slate-500">{helper}</p>}
    </div>
  );
}

function getInitials(name) {
  if (!name) return "U";

  const words = name.trim().split(" ");

  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }

  return `${words[0].charAt(0)}${words[words.length - 1].charAt(
    0
  )}`.toUpperCase();
}