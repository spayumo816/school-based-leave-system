import { useEffect, useMemo, useState } from "react";
import { Button, Card } from "@heroui/react";
import {
  ArchiveBoxIcon,
  BookOpenIcon,
  DocumentTextIcon,
  EyeIcon,
  PencilSquareIcon,
  PlusIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../app/AuthContext";
import { getSchoolCredits } from "../services/creditService";
import {
  addEarnedCredit,
  createBeginningBalance,
  getEmployeeLedger,
  updateLedgerTransaction,
} from "../services/ledgerService";

const teachingLeaveTypeOptions = [
  { label: "Service Credits", value: "vacation_service_credit" },
  { label: "Sick Leave", value: "sick_leave" },
  { label: "Maternity Leave", value: "maternity_leave" },
  { label: "Paternity Leave", value: "paternity_leave" },
  { label: "Solo Parent Leave", value: "solo_parent_leave" },
  { label: "Study Leave", value: "study_leave" },
  { label: "Rehabilitation Leave", value: "rehabilitation_leave" },
  {
    label: "Special Leave Benefit for Women",
    value: "special_leave_benefit_for_women",
  },
  { label: "Adoption Leave", value: "adoption_leave" },
  { label: "Other", value: "other" },
];

const nonTeachingLeaveTypeOptions = [
  { label: "Vacation Leave", value: "vacation_leave" },
  { label: "Sick Leave", value: "sick_leave" },
  { label: "Special Privilege Leave", value: "special_privilege_leave" },
  { label: "Force Leave", value: "force_leave" },
  { label: "Maternity Leave", value: "maternity_leave" },
  { label: "Paternity Leave", value: "paternity_leave" },
  { label: "Solo Parent Leave", value: "solo_parent_leave" },
  { label: "Study Leave", value: "study_leave" },
  { label: "Rehabilitation Leave", value: "rehabilitation_leave" },
  {
    label: "Special Leave Benefit for Women",
    value: "special_leave_benefit_for_women",
  },
  { label: "Adoption Leave", value: "adoption_leave" },
  { label: "Other", value: "other" },
];

const editableLedgerTransactionTypes = ["beginning_balance", "earned_credit"];

const getLeaveTypeOptionsByPersonnelType = (personnelType) => {
  return personnelType === "teaching"
    ? teachingLeaveTypeOptions
    : nonTeachingLeaveTypeOptions;
};

const formatLabel = (value) => value?.replaceAll("_", " ") || "";

const isVacationLeaveEquivalent = (leaveType) => {
  return (
    leaveType === "vacation_leave" || leaveType === "vacation_service_credit"
  );
};

const formatLeaveType = (leaveType, personnelType) => {
  if (leaveType === "vacation_service_credit") {
    return personnelType === "teaching" ? "Service Credits" : "Vacation Leave";
  }

  const labels = {
    vacation_leave: "Vacation Leave",
    sick_leave: "Sick Leave",
    special_privilege_leave: "Special Privilege Leave",
    force_leave: "Force Leave",
    maternity_leave: "Maternity Leave",
    paternity_leave: "Paternity Leave",
    solo_parent_leave: "Solo Parent Leave",
    study_leave: "Study Leave",
    rehabilitation_leave: "Rehabilitation Leave",
    special_leave_benefit_for_women: "Special Leave Benefit for Women",
    adoption_leave: "Adoption Leave",
    other: "Other",
  };

  return labels[leaveType] || leaveType?.replaceAll("_", " ") || "";
};

const formatDate = (date) => {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getTodayInputValue = () => {
  return new Date().toISOString().split("T")[0];
};

const formatDateForInput = (date) => {
  if (!date) return getTodayInputValue();

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return getTodayInputValue();
  }

  const timezoneOffset = parsedDate.getTimezoneOffset() * 60000;
  const localDate = new Date(parsedDate.getTime() - timezoneOffset);

  return localDate.toISOString().split("T")[0];
};

const getStatusClass = (transactionType) => {
  if (transactionType === "earned_credit") {
    return "bg-green-100 text-green-700";
  }

  if (transactionType === "leave_deduction") {
    return "bg-red-100 text-red-700";
  }

  if (transactionType === "beginning_balance") {
    return "bg-sky-100 text-sky-700";
  }

  return "bg-slate-100 text-slate-700";
};

const formatTransactionType = (transactionType) => {
  const labels = {
    beginning_balance: "Beginning Balance",
    earned_credit: "Earned Credit",
    leave_deduction: "Leave Deduction",
    adjustment: "Adjustment",
  };

  return labels[transactionType] || formatLabel(transactionType);
};

const getDisplayBalanceKey = (leaveType, personnelType) => {
  if (personnelType !== "teaching" && isVacationLeaveEquivalent(leaveType)) {
    return "vacation_leave";
  }

  return leaveType;
};

const getDisplayBalances = (balances, personnelType) => {
  const balanceMap = new Map();

  balances.forEach((credit) => {
    const key = getDisplayBalanceKey(credit.leaveType, personnelType);

    if (!balanceMap.has(key)) {
      balanceMap.set(key, {
        leaveType: key,
        earned: 0,
        used: 0,
        remarks: "",
      });
    }

    const existing = balanceMap.get(key);

    existing.earned += Number(credit.earned || 0);
    existing.used += Number(credit.used || 0);

    if (credit.remarks) {
      existing.remarks = existing.remarks
        ? `${existing.remarks}; ${credit.remarks}`
        : credit.remarks;
    }
  });

  return Array.from(balanceMap.values());
};

const isTransactionMatchingFilter = (
  transactionLeaveType,
  selectedLeaveType,
  personnelType
) => {
  if (selectedLeaveType === "all") return true;

  if (personnelType !== "teaching" && selectedLeaveType === "vacation_leave") {
    return isVacationLeaveEquivalent(transactionLeaveType);
  }

  return transactionLeaveType === selectedLeaveType;
};

const hasBeginningBalanceForLeaveType = (
  transactions,
  leaveType,
  personnelType
) => {
  return transactions.some((transaction) => {
    if (transaction.transactionType !== "beginning_balance") return false;

    if (personnelType !== "teaching" && leaveType === "vacation_leave") {
      return isVacationLeaveEquivalent(transaction.leaveType);
    }

    return transaction.leaveType === leaveType;
  });
};

const isEditableLedgerTransaction = (transaction) => {
  return editableLedgerTransactionTypes.includes(transaction.transactionType);
};

const getEditAmountLabel = (transactionType) => {
  return transactionType === "beginning_balance"
    ? "Beginning Balance Credits"
    : "Earned Credit";
};

function EmptyState({ title, description }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <DocumentTextIcon className="mx-auto h-10 w-10 text-slate-400" />
      <p className="mt-3 font-semibold text-slate-700">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}

export default function LeaveLedgerPage() {
  const { role, currentMembership } = useAuth();

  const isTeacher = role === "teacher";
  const canManageLedger = role === "admin_officer";

  const [employeeRecords, setEmployeeRecords] = useState([]);
  const [ledgerData, setLedgerData] = useState(null);

  const [selectedUserSchoolId, setSelectedUserSchoolId] = useState("");
  const [selectedLeaveType, setSelectedLeaveType] = useState("all");

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    leaveType: "",
    earned: "",
    transactionDate: getTodayInputValue(),
    particulars: "Earned leave credit",
    remarks: "",
  });

  const [isBeginningDrawerOpen, setIsBeginningDrawerOpen] = useState(false);
  const [beginningForm, setBeginningForm] = useState({
    leaveType: "",
    beginningBalance: "",
    transactionDate: getTodayInputValue(),
    remarks: "",
  });

  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [editForm, setEditForm] = useState({
    leaveType: "",
    earned: "",
    transactionDate: getTodayInputValue(),
    particulars: "",
    remarks: "",
  });

  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [saving, setSaving] = useState(false);

  const [pageError, setPageError] = useState("");
  const [drawerError, setDrawerError] = useState("");

  useEffect(() => {
    setSelectedUserSchoolId("");
    setLedgerData(null);
    setSelectedLeaveType("all");
    loadInitialLedgerData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTeacher, currentMembership?._id]);

  useEffect(() => {
    if (!isTeacher && selectedUserSchoolId) {
      loadEmployeeLedger(selectedUserSchoolId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUserSchoolId, isTeacher]);

  const loadInitialLedgerData = async () => {
    if (isTeacher) {
      if (!currentMembership?._id) {
        setPageError("Your employee profile was not found.");
        setLoadingEmployees(false);
        return;
      }

      setLoadingEmployees(false);
      setSelectedUserSchoolId(currentMembership._id);
      await loadEmployeeLedger(currentMembership._id);
      return;
    }

    await loadEmployeeList();
  };

  const loadEmployeeList = async () => {
    try {
      setLoadingEmployees(true);
      setPageError("");

      const data = await getSchoolCredits();
      setEmployeeRecords(data);

      if (data.length > 0) {
        setSelectedUserSchoolId(
          (current) => current || data[0].userSchool?._id || ""
        );
      }
    } catch (err) {
      setPageError(err.message || "Failed to load employees.");
    } finally {
      setLoadingEmployees(false);
    }
  };

  const loadEmployeeLedger = async (userSchoolId) => {
    try {
      setLoadingLedger(true);
      setPageError("");

      const data = await getEmployeeLedger(userSchoolId);
      setLedgerData(data);
    } catch (err) {
      setLedgerData(null);
      setPageError(err.message || "Failed to load leave ledger.");
    } finally {
      setLoadingLedger(false);
    }
  };

  const selectedEmployee = ledgerData?.userSchool || null;
  const selectedPersonnelType =
    selectedEmployee?.personnelType || "non_teaching";

  const leaveTypeOptions = useMemo(() => {
    return getLeaveTypeOptionsByPersonnelType(selectedPersonnelType);
  }, [selectedPersonnelType]);

  const beginningBalanceLeaveTypeOptions = useMemo(() => {
    const transactions = ledgerData?.transactions || [];

    return leaveTypeOptions.filter(
      (option) =>
        !hasBeginningBalanceForLeaveType(
          transactions,
          option.value,
          selectedPersonnelType
        )
    );
  }, [ledgerData, leaveTypeOptions, selectedPersonnelType]);

  const displayBalances = useMemo(() => {
    return getDisplayBalances(ledgerData?.balances || [], selectedPersonnelType);
  }, [ledgerData, selectedPersonnelType]);

  const filteredTransactions = useMemo(() => {
    return (ledgerData?.transactions || [])
      .filter((transaction) =>
        isTransactionMatchingFilter(
          transaction.leaveType,
          selectedLeaveType,
          selectedPersonnelType
        )
      )
      .sort((a, b) => {
        const dateA = new Date(a.transactionDate);
        const dateB = new Date(b.transactionDate);

        if (dateA.getTime() !== dateB.getTime()) {
          return dateA - dateB;
        }

        return new Date(a.createdAt) - new Date(b.createdAt);
      });
  }, [ledgerData, selectedLeaveType, selectedPersonnelType]);

  const openAddEarnedCreditDrawer = () => {
    const defaultLeaveType = leaveTypeOptions[0]?.value || "";

    setAddForm({
      leaveType: defaultLeaveType,
      earned: "",
      transactionDate: getTodayInputValue(),
      particulars: "Earned leave credit",
      remarks: "",
    });

    setDrawerError("");
    setIsAddDrawerOpen(true);
  };

  const closeAddEarnedCreditDrawer = () => {
    setIsAddDrawerOpen(false);
    setDrawerError("");
    setAddForm({
      leaveType: "",
      earned: "",
      transactionDate: getTodayInputValue(),
      particulars: "Earned leave credit",
      remarks: "",
    });
  };

  const openBeginningBalanceDrawer = () => {
    const defaultLeaveType = beginningBalanceLeaveTypeOptions[0]?.value || "";

    setBeginningForm({
      leaveType: defaultLeaveType,
      beginningBalance: "",
      transactionDate: getTodayInputValue(),
      remarks: "",
    });

    setDrawerError("");
    setIsBeginningDrawerOpen(true);
  };

  const closeBeginningBalanceDrawer = () => {
    setIsBeginningDrawerOpen(false);
    setDrawerError("");
    setBeginningForm({
      leaveType: "",
      beginningBalance: "",
      transactionDate: getTodayInputValue(),
      remarks: "",
    });
  };

  const openEditLedgerDrawer = (transaction) => {
    if (!canManageLedger) return;

    if (!isEditableLedgerTransaction(transaction)) {
      setPageError(
        "Only beginning balance and earned credit entries can be edited."
      );
      return;
    }

    setSelectedTransaction(transaction);

    setEditForm({
      leaveType: transaction.leaveType || "",
      earned: String(transaction.earned ?? ""),
      transactionDate: formatDateForInput(transaction.transactionDate),
      particulars: transaction.particulars || "",
      remarks: transaction.remarks || "",
    });

    setDrawerError("");
    setIsEditDrawerOpen(true);
  };

  const closeEditLedgerDrawer = () => {
    setIsEditDrawerOpen(false);
    setSelectedTransaction(null);
    setDrawerError("");
    setEditForm({
      leaveType: "",
      earned: "",
      transactionDate: getTodayInputValue(),
      particulars: "",
      remarks: "",
    });
  };

  const handleAddEarnedCredit = async (e) => {
    e.preventDefault();

    if (!canManageLedger) return;

    if (!selectedUserSchoolId) {
      setDrawerError("Please select an employee first.");
      return;
    }

    if (!addForm.leaveType) {
      setDrawerError("Please select a leave type.");
      return;
    }

    if (!Number(addForm.earned) || Number(addForm.earned) <= 0) {
      setDrawerError("Earned credit must be greater than zero.");
      return;
    }

    try {
      setSaving(true);
      setDrawerError("");

      await addEarnedCredit(selectedUserSchoolId, {
        leaveType: addForm.leaveType,
        earned: Number(addForm.earned),
        transactionDate: addForm.transactionDate,
        particulars: addForm.particulars || "Earned leave credit",
        remarks: addForm.remarks,
      });

      await Promise.all([
        loadEmployeeList(),
        loadEmployeeLedger(selectedUserSchoolId),
      ]);

      closeAddEarnedCreditDrawer();
    } catch (err) {
      setDrawerError(err.message || "Failed to add earned credit.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateBeginningBalance = async (e) => {
    e.preventDefault();

    if (!canManageLedger) return;

    if (!selectedUserSchoolId) {
      setDrawerError("Please select an employee first.");
      return;
    }

    if (!beginningForm.leaveType) {
      setDrawerError("Please select a leave type.");
      return;
    }

    if (
      beginningForm.beginningBalance === "" ||
      Number(beginningForm.beginningBalance) < 0
    ) {
      setDrawerError("Beginning balance must be zero or greater.");
      return;
    }

    try {
      setSaving(true);
      setDrawerError("");

      await createBeginningBalance(selectedUserSchoolId, {
        leaveType: beginningForm.leaveType,
        beginningBalance: Number(beginningForm.beginningBalance),
        transactionDate: beginningForm.transactionDate,
        remarks: beginningForm.remarks,
      });

      await Promise.all([
        loadEmployeeList(),
        loadEmployeeLedger(selectedUserSchoolId),
      ]);

      closeBeginningBalanceDrawer();
    } catch (err) {
      setDrawerError(err.message || "Failed to create beginning balance.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateLedgerTransaction = async (e) => {
    e.preventDefault();

    if (!canManageLedger) return;

    if (!selectedTransaction?._id) {
      setDrawerError("Please select a ledger entry to edit.");
      return;
    }

    if (!isEditableLedgerTransaction(selectedTransaction)) {
      setDrawerError(
        "Only beginning balance and earned credit entries can be edited."
      );
      return;
    }

    if (!editForm.leaveType) {
      setDrawerError("Please select a leave type.");
      return;
    }

    if (editForm.earned === "" || Number(editForm.earned) < 0) {
      setDrawerError("Credit amount must be zero or greater.");
      return;
    }

    if (
      selectedTransaction.transactionType === "earned_credit" &&
      Number(editForm.earned) <= 0
    ) {
      setDrawerError("Earned credit must be greater than zero.");
      return;
    }

    try {
      setSaving(true);
      setDrawerError("");

      const currentSelectedId = selectedUserSchoolId;

      await updateLedgerTransaction(selectedTransaction._id, {
        leaveType: editForm.leaveType,
        earned: Number(editForm.earned),
        transactionDate: editForm.transactionDate,
        particulars: editForm.particulars,
        remarks: editForm.remarks,
      });

      await loadEmployeeLedger(currentSelectedId);
      await loadEmployeeList();

      closeEditLedgerDrawer();
    } catch (err) {
      setDrawerError(err.message || "Failed to update ledger entry.");
    } finally {
      setSaving(false);
    }
  };

  if (loadingEmployees) {
    return (
      <div className="space-y-6">
        <div className="h-24 animate-pulse rounded-3xl bg-slate-200" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="h-36 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-36 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-36 animate-pulse rounded-2xl bg-slate-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-linear-to-br from-sky-600 via-sky-500 to-cyan-400 p-6 text-white shadow-sm">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-100">
              Leave Ledger
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              {isTeacher ? "My Leave Ledger" : "Employee Leave Ledger"}
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-sky-50">
              Track beginning balances, earned credits, approved leave
              deductions, and running balances in one organized view.
            </p>
          </div>

          <div className="rounded-2xl bg-white/15 px-4 py-3 text-sm backdrop-blur">
            <p className="text-sky-50">Access Mode</p>
            <p className="font-semibold">
              {canManageLedger
                ? "Ledger Management"
                : isTeacher
                ? "View Only"
                : "Monitoring"}
            </p>
          </div>
        </div>
      </section>

      {pageError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {pageError}
        </div>
      )}

      <Card className="border border-slate-200 bg-white shadow-sm">
        <Card.Content className="p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
              <EyeIcon className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-bold text-slate-900">Ledger Filters</h2>
              <p className="text-sm text-slate-500">
                Select an employee and filter ledger transactions by leave type.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {!isTeacher && (
              <FormSelect
                label="Employee"
                value={selectedUserSchoolId}
                onChange={(value) => {
                  setSelectedUserSchoolId(value);
                  setSelectedLeaveType("all");
                }}
                options={employeeRecords.map((record) => ({
                  label: `${record.userSchool?.user?.name || "Employee"} - ${
                    record.userSchool?.employeeNumber || "No Employee No."
                  }`,
                  value: record.userSchool?._id,
                }))}
              />
            )}

            {isTeacher && (
              <div>
                <p className="mb-2 block text-sm font-medium text-slate-700">
                  Employee
                </p>

                <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700">
                  {currentMembership?.user?.name ||
                    selectedEmployee?.user?.name ||
                    "My Leave Ledger"}
                </div>
              </div>
            )}

            <FormSelect
              label="Leave Type"
              value={selectedLeaveType}
              onChange={setSelectedLeaveType}
              options={[
                { label: "All Leave Types", value: "all" },
                ...leaveTypeOptions,
              ]}
            />
          </div>
        </Card.Content>
      </Card>

      {loadingLedger && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
          Loading selected employee ledger...
        </div>
      )}

      {!loadingLedger && !selectedEmployee && !pageError && (
        <EmptyState
          title="No ledger selected"
          description="Select an employee to view leave balances and ledger history."
        />
      )}

      {!loadingLedger && selectedEmployee && (
        <Card className="border border-slate-200 bg-white shadow-sm">
          <Card.Content className="p-5">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                  <UserIcon className="h-6 w-6" />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Employee Profile
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-slate-900">
                    {selectedEmployee.user?.name}
                  </h2>

                  <p className="text-sm text-slate-500">
                    {selectedEmployee.employeeNumber} ·{" "}
                    {selectedEmployee.position || "No position"}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    {selectedEmployee.school?.schoolName || "School not shown"}
                  </p>
                </div>
              </div>

              {canManageLedger && (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    variant="flat"
                    color="primary"
                    onPress={openBeginningBalanceDrawer}
                    className="gap-2"
                    isDisabled={beginningBalanceLeaveTypeOptions.length === 0}
                  >
                    <ArchiveBoxIcon className="h-4 w-4" />
                    {beginningBalanceLeaveTypeOptions.length === 0
                      ? "All Beginning Balances Created"
                      : "Create Beginning Balance"}
                  </Button>

                  <Button
                    color="primary"
                    onPress={openAddEarnedCreditDrawer}
                    className="gap-2 bg-sky-600 font-semibold text-white"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add Earned Credit
                  </Button>
                </div>
              )}
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
              <InfoTile
                label="Personnel Type"
                value={formatLabel(selectedEmployee.personnelType)}
              />

              <InfoTile
                label="Date Hired"
                value={formatDate(selectedEmployee.dateHired)}
              />

              <InfoTile
                label="Ledger Access"
                value={
                  canManageLedger
                    ? "Can manage balances"
                    : isTeacher
                    ? "View only"
                    : "Can view records"
                }
              />
            </div>
          </Card.Content>
        </Card>
      )}

      {!loadingLedger && selectedEmployee && (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {displayBalances.length === 0 ? (
            <Card className="border border-slate-200 bg-white shadow-sm md:col-span-3">
              <Card.Content className="p-5">
                <EmptyState
                  title="No leave balances found"
                  description="Balances will appear once beginning balances or earned credits are encoded."
                />
              </Card.Content>
            </Card>
          ) : (
            displayBalances.map((credit) => {
              const earned = Number(credit.earned || 0);
              const used = Number(credit.used || 0);
              const remaining = earned - used;
              const progress =
                earned > 0 ? Math.min(100, (remaining / earned) * 100) : 0;

              return (
                <Card
                  key={credit.leaveType}
                  className="border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <Card.Content className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-700">
                          {formatLeaveType(
                            credit.leaveType,
                            selectedPersonnelType
                          )}
                        </p>

                        <p className="mt-3 text-3xl font-bold text-sky-700">
                          {remaining}
                        </p>

                        <p className="text-sm text-slate-500">
                          remaining balance
                        </p>
                      </div>

                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                        <BookOpenIcon className="h-5 w-5" />
                      </div>
                    </div>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-sky-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">Earned</p>
                        <p className="font-semibold text-slate-900">
                          {earned}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">Used</p>
                        <p className="font-semibold text-slate-900">{used}</p>
                      </div>
                    </div>

                    {credit.remarks && (
                      <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-500">
                        {credit.remarks}
                      </p>
                    )}
                  </Card.Content>
                </Card>
              );
            })
          )}
        </section>
      )}

      {!loadingLedger && selectedEmployee && (
        <Card className="border border-slate-200 bg-white shadow-sm">
          <Card.Content className="p-0">
            <div className="flex flex-col justify-between gap-3 border-b border-slate-200 p-5 md:flex-row md:items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Ledger History
                </h2>

                <p className="text-sm text-slate-500">
                  Transaction history including beginning balances, earned
                  credits, leave deductions, and running balances.
                </p>
              </div>

              <div className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
                {filteredTransactions.length} transaction(s)
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-300">
                <thead className="bg-slate-50">
                  <tr>
                    <TableHeader>Date</TableHeader>
                    <TableHeader>Type</TableHeader>
                    <TableHeader>Leave Type</TableHeader>
                    <TableHeader>Particulars</TableHeader>
                    <TableHeader>School Source</TableHeader>
                    <TableHeader>Earned</TableHeader>
                    <TableHeader>Used w/ Pay</TableHeader>
                    <TableHeader>Used w/o Pay</TableHeader>
                    <TableHeader>Balance</TableHeader>
                    <TableHeader>Encoded By</TableHeader>
                    <TableHeader>Remarks</TableHeader>
                    {canManageLedger && <TableHeader>Action</TableHeader>}
                  </tr>
                </thead>

                <tbody>
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={canManageLedger ? 12 : 11}
                        className="px-4 py-10 text-center text-sm text-slate-500"
                      >
                        No ledger transactions found yet.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((transaction) => (
                      <tr
                        key={transaction._id}
                        className="border-t border-slate-200 transition hover:bg-slate-50"
                      >
                        <TableCell>
                          {formatDate(transaction.transactionDate)}
                        </TableCell>

                        <TableCell>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                              transaction.transactionType
                            )}`}
                          >
                            {formatTransactionType(
                              transaction.transactionType
                            )}
                          </span>
                        </TableCell>

                        <TableCell>
                          {formatLeaveType(
                            transaction.leaveType,
                            selectedPersonnelType
                          )}
                        </TableCell>

                        <TableCell muted>{transaction.particulars}</TableCell>

                        <TableCell muted>
                          {transaction.userSchool?.school?.schoolName ||
                            selectedEmployee.school?.schoolName ||
                            "-"}
                        </TableCell>

                        <TableCell>{transaction.earned || 0}</TableCell>

                        <TableCell>{transaction.usedWithPay || 0}</TableCell>

                        <TableCell>
                          {transaction.usedWithoutPay || 0}
                        </TableCell>

                        <TableCell strong>{transaction.balanceAfter}</TableCell>

                        <TableCell muted>
                          {transaction.createdBy?.user?.name || "-"}
                        </TableCell>

                        <TableCell muted>
                          {transaction.remarks || "-"}
                        </TableCell>

                        {canManageLedger && (
                          <TableCell>
                            {isEditableLedgerTransaction(transaction) ? (
                              <Button
                                size="sm"
                                variant="flat"
                                color="primary"
                                onPress={() =>
                                  openEditLedgerDrawer(transaction)
                                }
                                className="gap-1 font-semibold"
                              >
                                <PencilSquareIcon className="h-4 w-4" />
                                Edit
                              </Button>
                            ) : (
                              <span className="text-xs text-slate-400">
                                Locked
                              </span>
                            )}
                          </TableCell>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card.Content>
        </Card>
      )}

      {canManageLedger && isBeginningDrawerOpen && selectedEmployee && (
        <DrawerShell
          title="Create Beginning Balance"
          subtitle={selectedEmployee.user?.name}
          onClose={closeBeginningBalanceDrawer}
        >
          <form
            onSubmit={handleCreateBeginningBalance}
            className="space-y-5 p-6"
          >
            {drawerError && <ErrorBox message={drawerError} />}

            <FormSelect
              label="Leave Type"
              value={beginningForm.leaveType}
              onChange={(value) =>
                setBeginningForm((current) => ({
                  ...current,
                  leaveType: value,
                }))
              }
              options={beginningBalanceLeaveTypeOptions}
            />

            <FormInput
              label="Beginning Balance Credits"
              type="number"
              value={beginningForm.beginningBalance}
              onChange={(value) =>
                setBeginningForm((current) => ({
                  ...current,
                  beginningBalance: value,
                }))
              }
              step="0.25"
              required
            />

            <FormInput
              label="Beginning Balance Date"
              type="date"
              value={beginningForm.transactionDate}
              onChange={(value) =>
                setBeginningForm((current) => ({
                  ...current,
                  transactionDate: value,
                }))
              }
              required
            />

            <FormTextarea
              label="Remarks"
              value={beginningForm.remarks}
              onChange={(value) =>
                setBeginningForm((current) => ({
                  ...current,
                  remarks: value,
                }))
              }
              placeholder="Example: Balance from previous manual leave card"
            />

            <DrawerActions
              onCancel={closeBeginningBalanceDrawer}
              loading={saving}
              submitLabel="Save Beginning Balance"
            />
          </form>
        </DrawerShell>
      )}

      {canManageLedger && isAddDrawerOpen && selectedEmployee && (
        <DrawerShell
          title="Add Earned Credit"
          subtitle={selectedEmployee.user?.name}
          onClose={closeAddEarnedCreditDrawer}
        >
          <form onSubmit={handleAddEarnedCredit} className="space-y-5 p-6">
            {drawerError && <ErrorBox message={drawerError} />}

            <FormSelect
              label="Leave Type"
              value={addForm.leaveType}
              onChange={(value) =>
                setAddForm((current) => ({
                  ...current,
                  leaveType: value,
                }))
              }
              options={leaveTypeOptions}
            />

            <FormInput
              label="Transaction Date"
              type="date"
              value={addForm.transactionDate}
              onChange={(value) =>
                setAddForm((current) => ({
                  ...current,
                  transactionDate: value,
                }))
              }
              required
            />

            <FormInput
              label="Earned Credit"
              type="number"
              value={addForm.earned}
              onChange={(value) =>
                setAddForm((current) => ({
                  ...current,
                  earned: value,
                }))
              }
              step="0.25"
              required
            />

            <FormInput
              label="Particulars"
              value={addForm.particulars}
              onChange={(value) =>
                setAddForm((current) => ({
                  ...current,
                  particulars: value,
                }))
              }
              required
            />

            <FormTextarea
              label="Remarks"
              value={addForm.remarks}
              onChange={(value) =>
                setAddForm((current) => ({
                  ...current,
                  remarks: value,
                }))
              }
              placeholder="Optional notes for this earned credit"
            />

            <DrawerActions
              onCancel={closeAddEarnedCreditDrawer}
              loading={saving}
              submitLabel="Save Entry"
            />
          </form>
        </DrawerShell>
      )}

      {canManageLedger &&
        isEditDrawerOpen &&
        selectedEmployee &&
        selectedTransaction && (
          <DrawerShell
            title="Edit Ledger Entry"
            subtitle={`${selectedEmployee.user?.name} · ${formatTransactionType(
              selectedTransaction.transactionType
            )}`}
            onClose={closeEditLedgerDrawer}
          >
            <form
              onSubmit={handleUpdateLedgerTransaction}
              className="space-y-5 p-6"
            >
              {drawerError && <ErrorBox message={drawerError} />}

              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Only manual ledger entries can be edited. Approved leave
                deductions are locked because they are connected to approved
                leave applications.
              </div>

              <FormSelect
                label="Leave Type"
                value={editForm.leaveType}
                onChange={(value) =>
                  setEditForm((current) => ({
                    ...current,
                    leaveType: value,
                  }))
                }
                options={leaveTypeOptions}
              />

              <FormInput
                label={getEditAmountLabel(selectedTransaction.transactionType)}
                type="number"
                value={editForm.earned}
                onChange={(value) =>
                  setEditForm((current) => ({
                    ...current,
                    earned: value,
                  }))
                }
                step="0.25"
                required
              />

              <FormInput
                label="Transaction Date"
                type="date"
                value={editForm.transactionDate}
                onChange={(value) =>
                  setEditForm((current) => ({
                    ...current,
                    transactionDate: value,
                  }))
                }
                required
              />

              {selectedTransaction.transactionType === "earned_credit" && (
                <FormInput
                  label="Particulars"
                  value={editForm.particulars}
                  onChange={(value) =>
                    setEditForm((current) => ({
                      ...current,
                      particulars: value,
                    }))
                  }
                  required
                />
              )}

              <FormTextarea
                label="Remarks"
                value={editForm.remarks}
                onChange={(value) =>
                  setEditForm((current) => ({
                    ...current,
                    remarks: value,
                  }))
                }
                placeholder="Explain the correction made to this entry"
              />

              <DrawerActions
                onCancel={closeEditLedgerDrawer}
                loading={saving}
                submitLabel="Save Changes"
              />
            </form>
          </DrawerShell>
        )}
    </div>
  );
}

function InfoTile({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold capitalize text-slate-800">
        {value || "-"}
      </p>
    </div>
  );
}

function TableHeader({ children }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  );
}

function TableCell({ children, muted = false, strong = false }) {
  return (
    <td
      className={`px-4 py-3 text-sm ${
        strong
          ? "font-bold text-sky-700"
          : muted
          ? "text-slate-500"
          : "text-slate-700"
      }`}
    >
      {children}
    </td>
  );
}

function DrawerShell({ title, subtitle, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
      <button
        type="button"
        aria-label="Close drawer"
        className="absolute inset-0 h-full w-full cursor-default"
        onClick={onClose}
      />

      <div className="relative h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl">
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

function ErrorBox({ message }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  );
}

function FormSelect({ label, value, onChange, options }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
      >
        {options.map((option) => (
          <option key={option.value || option.label} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function FormInput({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  step,
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
        required={required}
        step={step}
        className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
      />
    </div>
  );
}

function FormTextarea({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
        placeholder={placeholder}
      />
    </div>
  );
}