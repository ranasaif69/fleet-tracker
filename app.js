// ======================================================
// CAR 4 U 1 LTD - FLEET MANAGER V8
// FINAL CLEAN REBUILD
// PART 1 OF 5
// SUPABASE + AUTH + VEHICLES + HELPERS
// ======================================================


// ======================================================
// SUPABASE CONNECTION
// ======================================================

const SUPABASE_URL =
  "https://ugsxnraeivhluhpzuful.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_tBBhN_wybueoX75Copcd2w_f5s9w4b7";

const OWNER_PHONE =
  "447426053788";

const OWNER_NAME =
  "Sufyan";

const sb =
  supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

const $ =
  id =>
    document.getElementById(id);


// ======================================================
// GLOBAL STATE
// ======================================================

let currentUser = null;
let currentProfile = null;

let fleet = [];
let expenses = {};
let documents = {};

let driverApplications = [];
let driverApplicationDocuments = {};

let editVehicleId = null;
let expenseVehicleId = null;

let selectedDriverApplicationId = null;
let selectedVehicleDocumentVehicleId = null;

let lastAssignedVehicleId = null;
let lastAssignedDriverApplicationId = null;

let refreshInProgress = false;
let lastRefreshTime = 0;
let lastButtonTap = 0;


// ======================================================
// START APP
// ======================================================

document.addEventListener(
  "DOMContentLoaded",
  async function() {

    addCreateAccountButton();

    ensureDriverApplicationsUI();

    await checkSession();

  }
);


// ======================================================
// CREATE ACCOUNT BUTTON
// ======================================================

function addCreateAccountButton() {

  const loginButton =
    document.querySelector(
      "#loginScreen button"
    );

  if (!loginButton) {
    return;
  }

  if (
    $("createAccountBtn")
  ) {
    return;
  }

  const button =
    document.createElement(
      "button"
    );

  button.id =
    "createAccountBtn";

  button.innerText =
    "Create Admin Account";

  button.className =
    "secondary";

  button.onclick =
    createAccount;

  loginButton.insertAdjacentElement(
    "afterend",
    button
  );
}


// ======================================================
// CHECK SESSION
// ======================================================

async function checkSession() {

  try {

    const {
      data,
      error
    } =
      await sb.auth.getSession();

    if (error) {
      throw error;
    }

    if (!data.session) {

      showLogin();

      return;
    }

    currentUser =
      data.session.user;

    await loadProfile();

    showApp();

    await refreshAll();

    showTab(
      "dashboard"
    );

  } catch (error) {

    console.error(
      "Session error:",
      error
    );

    showLogin();

    if (
      $("loginMessage")
    ) {

      $("loginMessage").innerText =
        error.message;

    }
  }
}


// ======================================================
// LOGIN
// ======================================================

async function login() {

  const email =
    $("loginEmail")
      ?.value
      .trim() ||
    "";

  const password =
    $("loginPassword")
      ?.value ||
    "";

  if (
    !email ||
    !password
  ) {

    if (
      $("loginMessage")
    ) {

      $("loginMessage").innerText =
        "Please enter your email and password.";

    }

    return;
  }

  if (
    $("loginMessage")
  ) {

    $("loginMessage").innerText =
      "Signing in...";

  }

  try {

    const {
      data,
      error
    } =
      await sb.auth
        .signInWithPassword({

          email:
            email,

          password:
            password

        });

    if (error) {
      throw error;
    }

    currentUser =
      data.user;

    await loadProfile();

    showApp();

    await refreshAll();

    showTab(
      "dashboard"
    );

    if (
      $("loginMessage")
    ) {

      $("loginMessage").innerText =
        "";

    }

  } catch (error) {

    console.error(
      "Login error:",
      error
    );

    if (
      $("loginMessage")
    ) {

      $("loginMessage").innerText =
        error.message;

    }
  }
}


// ======================================================
// CREATE ADMIN ACCOUNT
// ======================================================

async function createAccount() {

  const email =
    $("loginEmail")
      ?.value
      .trim() ||
    "";

  const password =
    $("loginPassword")
      ?.value ||
    "";

  if (!email) {

    alert(
      "Enter your email address first."
    );

    return;
  }

  if (
    !password ||
    password.length < 6
  ) {

    alert(
      "Choose a password with at least 6 characters."
    );

    return;
  }

  if (
    !confirm(
      "Create this as your Car 4 U 1 Fleet Manager account?"
    )
  ) {
    return;
  }

  if (
    $("loginMessage")
  ) {

    $("loginMessage").innerText =
      "Creating account...";

  }

  try {

    const {
      data,
      error
    } =
      await sb.auth.signUp({

        email:
          email,

        password:
          password,

        options: {

          data: {
            name:
              OWNER_NAME
          }

        }

      });

    if (error) {
      throw error;
    }

    if (
      data.session
    ) {

      currentUser =
        data.user;

      await loadProfile();

      showApp();

      await refreshAll();

      showTab(
        "dashboard"
      );

      return;
    }

    if (
      $("loginMessage")
    ) {

      $("loginMessage").innerText =
        "Account created. Check your email and confirm it, then log in.";

    }

  } catch (error) {

    console.error(
      "Create account error:",
      error
    );

    if (
      $("loginMessage")
    ) {

      $("loginMessage").innerText =
        error.message;

    }
  }
}


// ======================================================
// SHOW LOGIN / APP
// ======================================================

function showLogin() {

  $("loginScreen")
    ?.classList
    .remove(
      "hidden"
    );

  $("app")
    ?.classList
    .add(
      "hidden"
    );
}


function showApp() {

  $("loginScreen")
    ?.classList
    .add(
      "hidden"
    );

  $("app")
    ?.classList
    .remove(
      "hidden"
    );
}


// ======================================================
// LOGOUT
// ======================================================

async function logout() {

  await sb.auth.signOut();

  currentUser =
    null;

  currentProfile =
    null;

  fleet =
    [];

  expenses =
    {};

  documents =
    {};

  driverApplications =
    [];

  driverApplicationDocuments =
    {};

  editVehicleId =
    null;

  expenseVehicleId =
    null;

  selectedDriverApplicationId =
    null;

  selectedVehicleDocumentVehicleId =
    null;

  lastAssignedVehicleId =
    null;

  lastAssignedDriverApplicationId =
    null;

  showLogin();
}


// ======================================================
// LOAD PROFILE
// ======================================================

async function loadProfile() {

  if (
    !currentUser
  ) {
    return;
  }

  for (
    let attempt = 0;
    attempt < 6;
    attempt++
  ) {

    const {
      data,
      error
    } =
      await sb
        .from(
          "profiles"
        )
        .select("*")
        .eq(
          "id",
          currentUser.id
        )
        .maybeSingle();

    if (error) {

      console.warn(
        "Profile load:",
        error
      );

    }

    if (data) {

      currentProfile =
        data;

      return;
    }

    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          400
        )
    );
  }
}


// ======================================================
// TABS
// ======================================================

function showTab(name) {

  document
    .querySelectorAll(
      ".tab"
    )
    .forEach(
      tab => {

        tab.classList.add(
          "hidden"
        );

      }
    );

  const selected =
    $(name);

  if (
    selected
  ) {

    selected.classList.remove(
      "hidden"
    );

  }

  if (
    name ===
    "reports"
  ) {

    report();

  }

  if (
    name ===
    "drivers"
  ) {

    renderDrivers();

  }
}


// ======================================================
// REFRESH ALL
// ======================================================

async function refreshAll() {

  if (
    !currentUser
  ) {
    return;
  }

  if (
    refreshInProgress
  ) {
    return;
  }

  refreshInProgress =
    true;

  try {

    await Promise.all([

      loadVehicles(),

      loadExpenses(),

      loadDocuments()

    ]);

    await loadDriverApplications(
      false,
      true
    );

    render();

    lastRefreshTime =
      Date.now();

  } catch (error) {

    console.error(
      "Refresh error:",
      error
    );

  } finally {

    refreshInProgress =
      false;

  }
}


// ======================================================
// LOAD VEHICLES
// ======================================================

async function loadVehicles() {

  const {
    data,
    error
  } =
    await sb
      .from(
        "vehicles"
      )
      .select("*")
      .order(
        "registration",
        {
          ascending:
            true
        }
      );

  if (error) {
    throw error;
  }

  fleet =
    data || [];
}


// ======================================================
// NEW VEHICLE
// ======================================================

function newCar() {

  editVehicleId =
    null;

  if (
    $("vehicleFormTitle")
  ) {

    $("vehicleFormTitle").innerText =
      "Add Vehicle";

  }

  const fields = [

    "plate",
    "model",
    "year",
    "mileage",
    "driver",
    "phone",
    "rent",
    "deposit",
    "balance",
    "mot",
    "tax",
    "insurance",
    "inspection",
    "service",
    "licence",
    "badge",
    "notes"

  ];

  fields.forEach(
    id => {

      if (
        $(id)
      ) {

        $(id).value =
          "";

      }

    }
  );

  if (
    $("status")
  ) {

    $("status").value =
      "Rented";

  }

  showTab(
    "addVehicle"
  );
}


// ======================================================
// SAVE VEHICLE
// ======================================================

async function saveVehicle() {

  if (
    !currentUser
  ) {

    alert(
      "Please login first."
    );

    return;
  }

  const registration =
    $("plate")
      ?.value
      .trim()
      .toUpperCase() ||
    "";

  if (
    !registration
  ) {

    alert(
      "Please enter the vehicle registration."
    );

    return;
  }

  const car = {

    manager_id:
      currentUser.id,

    registration:
      registration,

    make_model:
      $("model")
        ?.value
        .trim() ||
      "",

    year:
      $("year")
        ?.value
        .trim() ||
      null,

    mileage:
      $("mileage")
        ?.value
          ? Number(
              $("mileage").value
            )
          : null,

    driver_name:
      $("driver")
        ?.value
        .trim() ||
      "",

    driver_phone:
      $("phone")
        ?.value
        .trim() ||
      "",

    weekly_rent:
      Number(
        $("rent")
          ?.value ||
        0
      ),

    deposit:
      Number(
        $("deposit")
          ?.value ||
        0
      ),

    outstanding:
      Number(
        $("balance")
          ?.value ||
        0
      ),

    mot_expiry:
      $("mot")
        ?.value ||
      null,

    tax_expiry:
      $("tax")
        ?.value ||
      null,

    insurance_expiry:
      $("insurance")
        ?.value ||
      null,

    inspection_expiry:
      $("inspection")
        ?.value ||
      null,

    service_due:
      $("service")
        ?.value ||
      null,

    licence_expiry:
      $("licence")
        ?.value ||
      null,

    badge_expiry:
      $("badge")
        ?.value ||
      null,

    status:
      $("status")
        ?.value ||
      "Rented",

    notes:
      $("notes")
        ?.value
        .trim() ||
      ""

  };


  try {

    let result;

    if (
      editVehicleId
    ) {

      result =
        await sb
          .from(
            "vehicles"
          )
          .update(
            car
          )
          .eq(
            "id",
            editVehicleId
          );

    } else {

      result =
        await sb
          .from(
            "vehicles"
          )
          .insert(
            car
          );

    }

    if (
      result.error
    ) {
      throw result.error;
    }

    editVehicleId =
      null;

    await refreshAll();

    showTab(
      "vehicles"
    );

    alert(
      "Vehicle saved successfully."
    );

  } catch (error) {

    console.error(
      "Save vehicle:",
      error
    );

    alert(
      "Could not save vehicle: " +
      error.message
    );
  }
}


// ======================================================
// EDIT VEHICLE
// ======================================================

function editVehicle(id) {

  const car =
    fleet.find(
      item =>
        item.id === id
    );

  if (
    !car
  ) {
    return;
  }

  editVehicleId =
    id;

  if (
    $("vehicleFormTitle")
  ) {

    $("vehicleFormTitle").innerText =
      "Edit Vehicle";

  }

  if ($("plate")) {
    $("plate").value =
      car.registration || "";
  }

  if ($("model")) {
    $("model").value =
      car.make_model || "";
  }

  if ($("year")) {
    $("year").value =
      car.year || "";
  }

  if ($("mileage")) {
    $("mileage").value =
      car.mileage || "";
  }

  if ($("driver")) {
    $("driver").value =
      car.driver_name || "";
  }

  if ($("phone")) {
    $("phone").value =
      car.driver_phone || "";
  }

  if ($("rent")) {
    $("rent").value =
      car.weekly_rent || "";
  }

  if ($("deposit")) {
    $("deposit").value =
      car.deposit || "";
  }

  if ($("balance")) {
    $("balance").value =
      car.outstanding || "";
  }

  if ($("mot")) {
    $("mot").value =
      car.mot_expiry || "";
  }

  if ($("tax")) {
    $("tax").value =
      car.tax_expiry || "";
  }

  if ($("insurance")) {
    $("insurance").value =
      car.insurance_expiry || "";
  }

  if ($("inspection")) {
    $("inspection").value =
      car.inspection_expiry || "";
  }

  if ($("service")) {
    $("service").value =
      car.service_due || "";
  }

  if ($("licence")) {
    $("licence").value =
      car.licence_expiry || "";
  }

  if ($("badge")) {
    $("badge").value =
      car.badge_expiry || "";
  }

  if ($("status")) {
    $("status").value =
      car.status || "Rented";
  }

  if ($("notes")) {
    $("notes").value =
      car.notes || "";
  }

  showTab(
    "addVehicle"
  );
}


// ======================================================
// DELETE VEHICLE
// ======================================================

async function deleteVehicle(id) {

  if (
    !confirm(
      "Delete this vehicle?"
    )
  ) {
    return;
  }

  try {

    const {
      data,
      error
    } =
      await sb
        .from(
          "vehicles"
        )
        .delete()
        .eq(
          "id",
          id
        )
        .select(
          "id"
        );

    if (
      error
    ) {
      throw error;
    }

    if (
      !data ||
      data.length !== 1
    ) {

      throw new Error(
        "Safety stop: exactly one vehicle should be deleted."
      );

    }

    await refreshAll();

  } catch (error) {

    console.error(
      "Delete vehicle:",
      error
    );

    alert(
      "Could not delete vehicle: " +
      error.message
    );
  }
}


// ======================================================
// DATE HELPERS
// ======================================================

function daysUntil(value) {

  if (
    !value
  ) {
    return null;
  }

  const today =
    new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );

  const target =
    new Date(
      value +
      "T00:00:00"
    );

  if (
    Number.isNaN(
      target.getTime()
    )
  ) {
    return null;
  }

  return Math.ceil(
    (
      target -
      today
    ) /
    86400000
  );
}


function formatDate(value) {

  if (
    !value
  ) {
    return "Not set";
  }

  const date =
    new Date(
      value +
      "T00:00:00"
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleDateString(
    "en-GB"
  );
}


// ======================================================
// HTML SAFETY
// ======================================================

function escapeHtml(value) {

  return String(
    value ?? ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}


// ======================================================
// END PART 1 OF 5
// ======================================================// ======================================================
// CAR 4 U 1 LTD - FLEET MANAGER V8
// FINAL CLEAN REBUILD
// PART 2 OF 5
// EXPENSES + VEHICLE DOCUMENTS + DASHBOARD + VEHICLES
// ======================================================


// ======================================================
// LOAD EXPENSES
// ======================================================

async function loadExpenses() {

  const {
    data,
    error
  } =
    await sb
      .from(
        "expenses"
      )
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      );

  if (error) {
    throw error;
  }

  expenses = {};

  (data || []).forEach(
    item => {

      const vehicleId =
        item.vehicle_id ||
        "general";

      if (
        !expenses[
          vehicleId
        ]
      ) {

        expenses[
          vehicleId
        ] = [];

      }

      expenses[
        vehicleId
      ].push(
        item
      );

    }
  );
}


// ======================================================
// OPEN EXPENSE FORM
// ======================================================

function openExpenses(
  vehicleId
) {

  expenseVehicleId =
    vehicleId;

  const vehicle =
    fleet.find(
      item =>
        item.id ===
        vehicleId
    );

  if (!vehicle) {

    alert(
      "Vehicle could not be found."
    );

    return;
  }

  if ($("expenseDesc")) {
    $("expenseDesc").value = "";
  }

  if ($("expenseAmount")) {
    $("expenseAmount").value = "";
  }

  if ($("expenseGarage")) {
    $("expenseGarage").value = "";
  }

  if ($("expenseDate")) {

    $("expenseDate").value =
      new Date()
        .toISOString()
        .split("T")[0];
  }

  if ($("expensePaidBy")) {
    $("expensePaidBy").value = "Cash";
  }

  if ($("expenseReceipt")) {
    $("expenseReceipt").value = "";
  }

  showTab(
    "expenseForm"
  );
}


// ======================================================
// SAVE EXPENSE
// ======================================================

async function saveExpense() {

  if (!expenseVehicleId) {

    alert(
      "No vehicle selected."
    );

    return;
  }

  const description =
    $("expenseDesc")
      ?.value
      .trim() ||
    "";

  const amount =
    Number(
      $("expenseAmount")
        ?.value ||
      0
    );

  const garage =
    $("expenseGarage")
      ?.value
      .trim() ||
    "";

  const expenseDate =
    $("expenseDate")
      ?.value ||
    null;

  const paidBy =
    $("expensePaidBy")
      ?.value ||
    "Cash";

  if (!description) {

    alert(
      "Please enter an expense description."
    );

    return;
  }

  if (amount <= 0) {

    alert(
      "Please enter a valid expense amount."
    );

    return;
  }

  try {

    const payload = {

      vehicle_id:
        expenseVehicleId,

      manager_id:
        currentUser?.id ||
        null,

      description:
        description,

      amount:
        amount,

      garage:
        garage,

      expense_date:
        expenseDate,

      paid_by:
        paidBy

    };

    const {
      error
    } =
      await sb
        .from(
          "expenses"
        )
        .insert(
          payload
        );

    if (error) {
      throw error;
    }

    await loadExpenses();

    render();

    alert(
      "Expense saved successfully."
    );

    showTab(
      "vehicles"
    );

  } catch (error) {

    console.error(
      "Save expense:",
      error
    );

    alert(
      "Could not save expense: " +
      error.message
    );
  }
}


// ======================================================
// VEHICLE EXPENSE TOTAL
// ======================================================

function vehicleExpenseTotal(
  vehicleId
) {

  return (
    expenses[
      vehicleId
    ] || []
  )
    .reduce(
      (
        total,
        item
      ) =>
        total +
        Number(
          item.amount ||
          0
        ),
      0
    );
}


// ======================================================
// VIEW VEHICLE EXPENSES
// ======================================================

function viewVehicleExpenses(
  vehicleId
) {

  const vehicle =
    fleet.find(
      item =>
        item.id ===
        vehicleId
    );

  if (!vehicle) {

    alert(
      "Vehicle could not be found."
    );

    return;
  }

  const list =
    expenses[
      vehicleId
    ] || [];

  let modal =
    $("vehicleExpensesModal");

  if (!modal) {

    modal =
      document.createElement(
        "div"
      );

    modal.id =
      "vehicleExpensesModal";

    modal.style.cssText = `
      position:fixed;
      inset:0;
      background:rgba(0,0,0,.60);
      z-index:10050;
      padding:20px;
      overflow:auto;
    `;

    modal.innerHTML = `

      <div
        style="
          max-width:650px;
          margin:40px auto;
          background:white;
          border-radius:20px;
          padding:22px;
        "
      >

        <h2 id="vehicleExpensesTitle">
          Vehicle Expenses
        </h2>

        <div
          id="vehicleExpensesList"
        ></div>

        <button
          class="secondary"
          onclick="closeVehicleExpensesModal()"
        >
          Close
        </button>

      </div>
    `;

    document.body.appendChild(
      modal
    );
  }

  $("vehicleExpensesTitle").innerText =
    `Expenses - ${vehicle.registration}`;

  const container =
    $("vehicleExpensesList");

  if (!list.length) {

    container.innerHTML = `

      <div class="card">
        No expenses recorded for this vehicle.
      </div>
    `;

  } else {

    const total =
      list.reduce(
        (
          sum,
          item
        ) =>
          sum +
          Number(
            item.amount ||
            0
          ),
        0
      );

    container.innerHTML = `

      <div class="card">

        <h3>
          Total Expenses:
          £${total.toFixed(2)}
        </h3>

      </div>

      ${
        list
          .map(
            item => `

              <div class="card">

                <h3>
                  £${Number(
                    item.amount ||
                    0
                  ).toFixed(2)}
                </h3>

                <p>
                  <b>Description:</b>
                  ${escapeHtml(
                    item.description ||
                    "-"
                  )}
                </p>

                <p>
                  <b>Garage:</b>
                  ${escapeHtml(
                    item.garage ||
                    "-"
                  )}
                </p>

                <p>
                  <b>Date:</b>
                  ${
                    item.expense_date
                      ? formatDate(
                          item.expense_date
                        )
                      : "-"
                  }
                </p>

                <p>
                  <b>Paid By:</b>
                  ${escapeHtml(
                    item.paid_by ||
                    "-"
                  )}
                </p>

                <button
                  class="danger"
                  onclick="deleteExpenseAndRefresh('${item.id}', '${vehicleId}')"
                >
                  Delete Expense
                </button>

              </div>
            `
          )
          .join("")
      }
    `;

  }

  modal.style.display =
    "block";
}


// ======================================================
// CLOSE EXPENSE MODAL
// ======================================================

function closeVehicleExpensesModal() {

  const modal =
    $("vehicleExpensesModal");

  if (modal) {

    modal.style.display =
      "none";

  }
}


// ======================================================
// DELETE EXPENSE
// ======================================================

async function deleteExpenseAndRefresh(
  expenseId,
  vehicleId
) {

  if (
    !confirm(
      "Delete this expense?"
    )
  ) {
    return;
  }

  try {

    const {
      data,
      error
    } =
      await sb
        .from(
          "expenses"
        )
        .delete()
        .eq(
          "id",
          expenseId
        )
        .select(
          "id"
        );

    if (error) {
      throw error;
    }

    if (
      !data ||
      data.length !== 1
    ) {

      throw new Error(
        "Safety stop: exactly one expense should be deleted."
      );

    }

    await loadExpenses();

    render();

    viewVehicleExpenses(
      vehicleId
    );

  } catch (error) {

    console.error(
      "Delete expense:",
      error
    );

    alert(
      "Could not delete expense: " +
      error.message
    );
  }
}


// ======================================================
// LOAD VEHICLE DOCUMENTS
// ======================================================

async function loadDocuments() {

  const {
    data,
    error
  } =
    await sb
      .from(
        "vehicle_documents"
      )
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      );

  if (error) {

    console.warn(
      "Vehicle documents:",
      error
    );

    documents = {};

    return;
  }

  documents = {};

  (data || []).forEach(
    item => {

      if (
        !documents[
          item.vehicle_id
        ]
      ) {

        documents[
          item.vehicle_id
        ] = [];

      }

      documents[
        item.vehicle_id
      ].push(
        item
      );

    }
  );
}


// ======================================================
// VEHICLE DOCUMENT LABEL
// ======================================================

function vehicleDocumentLabel(
  type
) {

  const value =
    String(
      type ||
      ""
    )
      .toLowerCase();

  if (
    value.includes(
      "mot"
    )
  ) {

    return "MOT Certificate";

  }

  if (
    value.includes(
      "v5"
    ) ||
    value.includes(
      "logbook"
    )
  ) {

    return "V5 / Logbook";

  }

  if (
    value.includes(
      "insurance"
    )
  ) {

    return "Insurance Certificate";

  }

  if (
    value.includes(
      "taxi"
    ) ||
    value.includes(
      "private_hire"
    )
  ) {

    return "Taxi / Private Hire Licence";

  }

  return (
    type ||
    "Vehicle Document"
  );
}


// ======================================================
// SAFE VEHICLE FILE NAME
// ======================================================

function safeVehicleDocumentFileName(
  name
) {

  return String(
    name ||
    "document"
  )
    .replace(
      /[^a-zA-Z0-9._-]/g,
      "_"
    );
}


// ======================================================
// OPEN VEHICLE DOCUMENTS
// ======================================================

function openVehicleDocuments(
  vehicleId
) {

  selectedVehicleDocumentVehicleId =
    vehicleId;

  const vehicle =
    fleet.find(
      item =>
        item.id ===
        vehicleId
    );

  if (!vehicle) {

    alert(
      "Vehicle could not be found."
    );

    return;
  }

  let modal =
    $("vehicleDocumentsModal");

  if (!modal) {

    modal =
      document.createElement(
        "div"
      );

    modal.id =
      "vehicleDocumentsModal";

    modal.style.cssText = `
      position:fixed;
      inset:0;
      background:rgba(0,0,0,.60);
      z-index:10000;
      padding:20px;
      overflow:auto;
    `;

    modal.innerHTML = `

      <div
        style="
          max-width:650px;
          margin:40px auto;
          background:white;
          border-radius:20px;
          padding:22px;
        "
      >

        <h2 id="vehicleDocumentsTitle">
          Vehicle Documents
        </h2>

        <label>
          <b>Document Type</b>
        </label>

        <select
          id="vehicleDocumentType"
        >

          <option value="mot">
            MOT Certificate
          </option>

          <option value="v5">
            V5 / Logbook
          </option>

          <option value="insurance">
            Insurance Certificate
          </option>

          <option value="taxi_licence">
            Taxi / Private Hire Licence
          </option>

        </select>

        <input
          id="vehicleDocumentFile"
          type="file"
          accept="image/*,.pdf"
          style="margin-top:15px;"
        >

        <button
          id="uploadVehicleDocumentButton"
          class="green"
          onclick="uploadVehicleDocument()"
        >
          Upload Document
        </button>

        <hr>

        <h3>
          Uploaded Documents
        </h3>

        <div
          id="vehicleDocumentsList"
        ></div>

        <button
          class="secondary"
          onclick="closeVehicleDocumentsModal()"
        >
          Close
        </button>

      </div>
    `;

    document.body.appendChild(
      modal
    );
  }

  $("vehicleDocumentsTitle").innerText =
    `Documents - ${vehicle.registration}`;

  if (
    $("vehicleDocumentFile")
  ) {

    $("vehicleDocumentFile").value =
      "";

  }

  renderVehicleDocumentsList();

  modal.style.display =
    "block";
}


// ======================================================
// CLOSE VEHICLE DOCUMENTS
// ======================================================

function closeVehicleDocumentsModal() {

  const modal =
    $("vehicleDocumentsModal");

  if (modal) {

    modal.style.display =
      "none";

  }
}


// ======================================================
// UPLOAD VEHICLE DOCUMENT
// ======================================================

async function uploadVehicleDocument() {

  if (
    !selectedVehicleDocumentVehicleId
  ) {

    alert(
      "No vehicle selected."
    );

    return;
  }

  const file =
    $("vehicleDocumentFile")
      ?.files?.[0];

  const documentType =
    $("vehicleDocumentType")
      ?.value;

  if (!file) {

    alert(
      "Please choose a document."
    );

    return;
  }

  const button =
    $("uploadVehicleDocumentButton");

  if (button) {

    button.disabled =
      true;

    button.innerText =
      "Uploading...";

  }

  try {

    const filePath =
      `${
        currentUser?.id ||
        "user"
      }/${
        selectedVehicleDocumentVehicleId
      }/${
        Date.now()
      }-${
        safeVehicleDocumentFileName(
          file.name
        )
      }`;

    const {
      error:
        uploadError
    } =
      await sb.storage
        .from(
          "vehicle-documents"
        )
        .upload(
          filePath,
          file,
          {
            upsert:
              false
          }
        );

    if (
      uploadError
    ) {
      throw uploadError;
    }

    const {
      error:
        insertError
    } =
      await sb
        .from(
          "vehicle_documents"
        )
        .insert({

          vehicle_id:
            selectedVehicleDocumentVehicleId,

          manager_id:
            currentUser?.id ||
            null,

          document_type:
            documentType,

          file_name:
            file.name,

          file_path:
            filePath

        });

    if (
      insertError
    ) {

      await sb.storage
        .from(
          "vehicle-documents"
        )
        .remove([
          filePath
        ]);

      throw insertError;
    }

    await loadDocuments();

    renderVehicleDocumentsList();

    renderVehicles();

    alert(
      "Document uploaded successfully."
    );

  } catch (error) {

    console.error(
      "Vehicle document upload:",
      error
    );

    alert(
      "Could not upload document: " +
      error.message
    );

  } finally {

    if (button) {

      button.disabled =
        false;

      button.innerText =
        "Upload Document";

    }
  }
}


// ======================================================
// RENDER VEHICLE DOCUMENT LIST
// ======================================================

function renderVehicleDocumentsList() {

  const container =
    $("vehicleDocumentsList");

  if (
    !container
  ) {
    return;
  }

  const list =
    documents[
      selectedVehicleDocumentVehicleId
    ] || [];

  if (
    !list.length
  ) {

    container.innerHTML = `

      <div class="card">
        No vehicle documents uploaded yet.
      </div>
    `;

    return;
  }

  container.innerHTML =
    list
      .map(
        document => `

          <div class="card">

            <h3>
              ${escapeHtml(
                vehicleDocumentLabel(
                  document.document_type
                )
              )}
            </h3>

            <p class="small">
              ${escapeHtml(
                document.file_name ||
                ""
              )}
            </p>

            <button
              class="blue"
              onclick="viewVehicleDocument('${document.id}')"
            >
              View / Download
            </button>

            <button
              class="danger"
              onclick="deleteVehicleDocument('${document.id}')"
            >
              Delete Document
            </button>

          </div>
        `
      )
      .join("");
}


// ======================================================
// VIEW VEHICLE DOCUMENT
// ======================================================

async function viewVehicleDocument(
  documentId
) {

  const document =
    Object
      .values(
        documents
      )
      .flat()
      .find(
        item =>
          item.id ===
          documentId
      );

  if (
    !document
  ) {

    alert(
      "Document could not be found."
    );

    return;
  }

  try {

    const {
      data,
      error
    } =
      await sb.storage
        .from(
          "vehicle-documents"
        )
        .createSignedUrl(
          document.file_path,
          86400,
          {
            download:
              true
          }
        );

    if (
      error
    ) {
      throw error;
    }

    if (
      !data?.signedUrl
    ) {

      throw new Error(
        "Could not create document link."
      );

    }

    window.open(
      data.signedUrl,
      "_blank"
    );

  } catch (error) {

    console.error(
      "View vehicle document:",
      error
    );

    alert(
      "Could not open document: " +
      error.message
    );
  }
}


// ======================================================
// DELETE VEHICLE DOCUMENT
// ======================================================

async function deleteVehicleDocument(
  documentId
) {

  const document =
    Object
      .values(
        documents
      )
      .flat()
      .find(
        item =>
          item.id ===
          documentId
      );

  if (!document) {
    return;
  }

  if (
    !confirm(
      `Delete ${
        vehicleDocumentLabel(
          document.document_type
        )
      }?`
    )
  ) {
    return;
  }

  try {

    const {
      error:
        storageError
    } =
      await sb.storage
        .from(
          "vehicle-documents"
        )
        .remove([
          document.file_path
        ]);

    if (
      storageError
    ) {
      throw storageError;
    }

    const {
      data,
      error
    } =
      await sb
        .from(
          "vehicle_documents"
        )
        .delete()
        .eq(
          "id",
          documentId
        )
        .select(
          "id"
        );

    if (
      error
    ) {
      throw error;
    }

    if (
      !data ||
      data.length !== 1
    ) {

      throw new Error(
        "Safety stop: exactly one document should be deleted."
      );

    }

    await loadDocuments();

    renderVehicleDocumentsList();

    renderVehicles();

  } catch (error) {

    console.error(
      "Delete vehicle document:",
      error
    );

    alert(
      "Could not delete document: " +
      error.message
    );
  }
}


// ======================================================
// BUILD ALERTS
// ======================================================

function buildAlerts() {

  const alerts =
    [];

  fleet.forEach(
    car => {

      const checks = [

        [
          "MOT",
          car.mot_expiry
        ],

        [
          "Road Tax",
          car.tax_expiry
        ],

        [
          "Insurance",
          car.insurance_expiry
        ],

        [
          "Taxi Inspection",
          car.inspection_expiry
        ],

        [
          "Taxi Licence",
          car.licence_expiry
        ],

        [
          "Badge",
          car.badge_expiry
        ]

      ];

      checks.forEach(
        (
          [
            label,
            date
          ]
        ) => {

          const days =
            daysUntil(
              date
            );

          if (
            days !== null &&
            days <= 30
          ) {

            alerts.push({

              registration:
                car.registration,

              label:
                label,

              date:
                date,

              days:
                days

            });

          }
        }
      );

    }
  );

  alerts.sort(
    (
      a,
      b
    ) =>
      a.days -
      b.days
  );

  return alerts;
}


// ======================================================
// RENDER ALL
// ======================================================

function render() {

  renderDashboard();

  renderVehicles();

  renderDrivers();

  ensureDriverApplicationsUI();
}


// ======================================================
// DASHBOARD
// ======================================================

function renderDashboard() {

  const alerts =
    buildAlerts();

  const weekly =
    fleet.reduce(
      (
        total,
        car
      ) =>
        total +
        Number(
          car.weekly_rent ||
          0
        ),
      0
    );

  const outstanding =
    fleet.reduce(
      (
        total,
        car
      ) =>
        total +
        Number(
          car.outstanding ||
          0
        ),
      0
    );

  if ($("statTotal")) {

    $("statTotal").innerText =
      fleet.length;

  }

  if ($("statRented")) {

    $("statRented").innerText =
      fleet.filter(
        car =>
          String(
            car.status ||
            ""
          )
            .toLowerCase() ===
          "rented"
      ).length;

  }

  if ($("statAvailable")) {

    $("statAvailable").innerText =
      fleet.filter(
        car =>
          String(
            car.status ||
            ""
          )
            .toLowerCase() ===
          "available"
      ).length;

  }

  if ($("statWeekly")) {

    $("statWeekly").innerText =
      "£" +
      weekly.toFixed(2);

  }

  if ($("statOutstanding")) {

    $("statOutstanding").innerText =
      "£" +
      outstanding.toFixed(2);

  }

  if ($("statAlerts")) {

    $("statAlerts").innerText =
      alerts.length;

  }

  const container =
    $("urgentAlerts");

  if (!container) {
    return;
  }

  if (!alerts.length) {

    container.innerHTML = `

      <p class="greenText">
        No urgent compliance alerts.
      </p>
    `;

    return;
  }

  container.innerHTML =
    alerts
      .map(
        alert => `

          <div class="card">

            <b>
              ${escapeHtml(
                alert.registration
              )}
            </b>

            <p>
              ${escapeHtml(
                alert.label
              )}
            </p>

            <p>
              ${formatDate(
                alert.date
              )}
            </p>

          </div>
        `
      )
      .join("");
}


// ======================================================
// RENDER VEHICLES
// ======================================================

function renderVehicles() {

  const container =
    $("vehicleList");

  if (!container) {
    return;
  }

  const search =
    (
      $("vehicleSearch")
        ?.value ||
      ""
    )
      .trim()
      .toLowerCase();

  const filtered =
    fleet.filter(
      car => {

        const text =
          [
            car.registration,
            car.make_model,
            car.driver_name,
            car.driver_phone,
            car.status
          ]
            .join(" ")
            .toLowerCase();

        return text.includes(
          search
        );

      }
    );

  if (!filtered.length) {

    container.innerHTML = `

      <div class="card">
        No vehicles found.
      </div>
    `;

    return;
  }

  container.innerHTML =
    filtered
      .map(
        car => `

          <div class="vehicle-card">

            <div class="row">

              <div>

                <h3>
                  ${escapeHtml(
                    car.registration ||
                    ""
                  )}
                </h3>

                <div class="small">
                  ${escapeHtml(
                    car.make_model ||
                    ""
                  )}
                </div>

              </div>

              <span class="badge">
                ${escapeHtml(
                  car.status ||
                  ""
                )}
              </span>

            </div>

            <hr>

            <p>
              <b>Driver:</b>
              ${escapeHtml(
                car.driver_name ||
                "No driver"
              )}
            </p>

            <p>
              <b>Phone:</b>
              ${escapeHtml(
                car.driver_phone ||
                "-"
              )}
            </p>

            <p>
              <b>Weekly Rent:</b>
              £${Number(
                car.weekly_rent ||
                0
              ).toFixed(2)}
            </p>

            <p>
              <b>Outstanding:</b>
              £${Number(
                car.outstanding ||
                0
              ).toFixed(2)}
            </p>

            <p>
              <b>Total Expenses:</b>
              £${vehicleExpenseTotal(
                car.id
              ).toFixed(2)}
            </p>

            <p>
              <b>Vehicle Documents:</b>
              ${
                (
                  documents[
                    car.id
                  ] || []
                ).length
              }
            </p>

            <div class="actions">

              <button
                onclick="editVehicle('${car.id}')"
              >
                Edit
              </button>

              <button
                class="blue"
                onclick="openVehicleDocuments('${car.id}')"
              >
                📂 Vehicle Documents
              </button>

              <button
                class="blue"
                onclick="openExpenses('${car.id}')"
              >
                ➕ Add Expense
              </button>

              <button
                class="secondary"
                onclick="viewVehicleExpenses('${car.id}')"
              >
                🧾 View Expenses
              </button>

              <button
                class="blue"
                onclick="sendWhatsApp('${car.id}')"
              >
                WhatsApp
              </button>

              <button
                class="danger"
                onclick="deleteVehicle('${car.id}')"
              >
                Delete
              </button>

            </div>

          </div>
        `
      )
      .join("");
}


// ======================================================
// VEHICLE WHATSAPP
// ======================================================

function sendWhatsApp(
  vehicleId
) {

  const car =
    fleet.find(
      item =>
        item.id ===
        vehicleId
    );

  if (!car) {
    return;
  }

  let phone =
    String(
      car.driver_phone ||
      ""
    )
      .replace(
        /[^0-9]/g,
        ""
      );

  if (
    phone.startsWith(
      "0"
    )
  ) {

    phone =
      "44" +
      phone.substring(
        1
      );

  }

  if (!phone) {

    alert(
      "No driver phone number saved."
    );

    return;
  }

  const message =
    encodeURIComponent(
      `Hi ${car.driver_name || ""}, this is Car 4 U 1 Ltd regarding vehicle ${car.registration || ""}.`
    );

  window.open(
    `https://wa.me/${phone}?text=${message}`,
    "_blank"
  );
}


// ======================================================
// END PART 2 OF 5
// ======================================================// ======================================================
// CAR 4 U 1 LTD - FLEET MANAGER V8
// FINAL CLEAN REBUILD
// PART 3 OF 5
// DRIVER APPLICATIONS + DOCUMENTS + SIGNED AGREEMENT
// ======================================================


// ======================================================
// DRIVER APPLICATIONS UI
// ======================================================

function ensureDriverApplicationsUI() {

  const nav =
    document.querySelector(
      "nav.tabs"
    );

  if (
    nav &&
    !$("driverApplicationsNavButton")
  ) {

    const button =
      document.createElement(
        "button"
      );

    button.id =
      "driverApplicationsNavButton";

    button.innerText =
      "Driver Applications";

    button.onclick =
      openDriverApplications;

    nav.appendChild(
      button
    );
  }


  const app =
    $("app");

  if (
    app &&
    !$("driverApplications")
  ) {

    const section =
      document.createElement(
        "section"
      );

    section.id =
      "driverApplications";

    section.className =
      "tab hidden";

    section.innerHTML = `

      <div class="panel">

        <div class="row">

          <div>

            <h2>
              👨‍✈️ Driver Applications
            </h2>

            <p class="small">
              Review applications, documents,
              signatures and approval status.
            </p>

          </div>

          <button
            class="blue"
            style="width:auto"
            onclick="loadDriverApplications(true)"
          >
            Refresh
          </button>

        </div>


        <input
          id="driverApplicationSearch"
          type="search"
          placeholder="Search name, phone, email or status"
          oninput="renderDriverApplications()"
        >


        <select
          id="driverApplicationStatusFilter"
          onchange="renderDriverApplications()"
        >

          <option value="">
            All Applications
          </option>

          <option value="invited">
            Invited
          </option>

          <option value="submitted">
            Submitted
          </option>

          <option value="approved">
            Approved
          </option>

          <option value="rejected">
            Rejected
          </option>

        </select>


        <div
          id="driverApplicationStats"
          class="stats"
          style="margin-top:12px"
        ></div>


        <div
          id="driverApplicationList"
        ></div>

      </div>
    `;

    app.appendChild(
      section
    );
  }


  if (
    app &&
    !$("driverApplicationDetail")
  ) {

    const detail =
      document.createElement(
        "section"
      );

    detail.id =
      "driverApplicationDetail";

    detail.className =
      "tab hidden";

    detail.innerHTML = `

      <div class="panel">

        <button
          class="secondary"
          onclick="openDriverApplications()"
        >
          ← Back to Driver Applications
        </button>

        <div
          id="driverApplicationDetailBox"
        ></div>

      </div>
    `;

    app.appendChild(
      detail
    );
  }
}


// ======================================================
// OPEN DRIVER APPLICATIONS
// ======================================================

async function openDriverApplications() {

  ensureDriverApplicationsUI();

  showTab(
    "driverApplications"
  );

  await loadDriverApplications();

  addDriverInvitationButton();
}


// ======================================================
// LOAD DRIVER APPLICATIONS
// ======================================================

async function loadDriverApplications(
  showMessage = false,
  quiet = false
) {

  const container =
    $("driverApplicationList");

  if (
    container &&
    !quiet
  ) {

    container.innerHTML = `

      <div class="card">
        Loading driver applications...
      </div>
    `;
  }

  try {

    const {
      data,
      error
    } =
      await sb
        .from(
          "driver_applications"
        )
        .select("*")
        .order(
          "created_at",
          {
            ascending:
              false
          }
        );

    if (error) {
      throw error;
    }

    driverApplications =
      data || [];

    await loadDriverApplicationDocuments();

    renderDriverApplications();

    renderDrivers();

    if (
      showMessage
    ) {

      alert(
        "Driver applications refreshed."
      );
    }

  } catch (error) {

    console.error(
      "Driver applications:",
      error
    );

    if (
      container &&
      !quiet
    ) {

      container.innerHTML = `

        <div class="card red">
          Could not load driver applications:
          ${escapeHtml(
            error.message
          )}
        </div>
      `;
    }
  }
}


// ======================================================
// LOAD DRIVER APPLICATION DOCUMENTS
// ======================================================

async function loadDriverApplicationDocuments() {

  driverApplicationDocuments =
    {};

  if (
    !driverApplications.length
  ) {
    return;
  }

  const ids =
    driverApplications
      .map(
        item =>
          item.id
      )
      .filter(
        Boolean
      );

  if (
    !ids.length
  ) {
    return;
  }

  try {

    const {
      data,
      error
    } =
      await sb
        .from(
          "driver_application_documents"
        )
        .select("*")
        .in(
          "application_id",
          ids
        );

    if (
      error
    ) {
      throw error;
    }

    (data || []).forEach(
      document => {

        const applicationId =
          document.application_id;

        if (
          !driverApplicationDocuments[
            applicationId
          ]
        ) {

          driverApplicationDocuments[
            applicationId
          ] = [];
        }

        driverApplicationDocuments[
          applicationId
        ].push(
          document
        );

      }
    );

  } catch (error) {

    console.error(
      "Driver document load:",
      error
    );
  }
}


// ======================================================
// STATUS HELPERS
// ======================================================

function applicationStatusClass(
  status
) {

  const value =
    String(
      status || ""
    )
      .toLowerCase();

  if (
    value ===
    "approved"
  ) {

    return "greenText";
  }

  if (
    value ===
    "rejected"
  ) {

    return "red";
  }

  if (
    value ===
    "submitted"
  ) {

    return "orange";
  }

  return "";
}


function applicationStatusText(
  status
) {

  const value =
    String(
      status ||
      "invited"
    );

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
}


// ======================================================
// DRIVER DOCUMENT LABELS
// ======================================================

function driverDocumentLabel(
  type
) {

  const labels = {

    driving_licence_front:
      "Driving Licence — Front",

    driving_licence_back:
      "Driving Licence — Back",

    taxi_badge:
      "Taxi / Private Hire Badge",

    taxi_paper_licence:
      "Taxi / Private Hire Paper Licence",

    proof_of_address:
      "Proof of Address",

    rental_agreement_signature:
      "✍️ Electronic Signature",

    rental_agreement_acceptance:
      "📄 Signed Rental Agreement"

  };

  return (
    labels[
      type
    ] ||
    type ||
    "Document"
  );
}


// ======================================================
// DRIVER DOCUMENT CARD
// ======================================================

function driverDocumentCard(
  document
) {

  const type =
    document.document_type ||
    "";

  if (
    type ===
    "rental_agreement_acceptance"
  ) {

    return `

      <div class="doc">

        <b>
          📄 Signed Rental Agreement
        </b>

        <p class="small">
          ${escapeHtml(
            document.file_name ||
            ""
          )}
        </p>

        <button
          class="green"
          onclick="viewSignedAgreement('${document.application_id}')"
        >
          View Signed Agreement
        </button>

      </div>
    `;
  }


  if (
    type ===
    "rental_agreement_signature"
  ) {

    return `

      <div class="doc">

        <b>
          ✍️ Electronic Signature
        </b>

        <p class="small">
          ${escapeHtml(
            document.file_name ||
            ""
          )}
        </p>

        <button
          class="blue"
          onclick="openDriverDocument('${document.id}', false)"
        >
          View Signature
        </button>

      </div>
    `;
  }


  return `

    <div class="doc">

      <b>
        ${escapeHtml(
          driverDocumentLabel(
            type
          )
        )}
      </b>

      <p class="small">
        ${escapeHtml(
          document.file_name ||
          ""
        )}
      </p>

      <button
        class="blue"
        onclick="openDriverDocument('${document.id}', true)"
      >
        View / Download
      </button>

    </div>
  `;
}


// ======================================================
// RENDER DRIVER APPLICATIONS
// ======================================================

function renderDriverApplications() {

  const container =
    $("driverApplicationList");

  if (
    !container
  ) {
    return;
  }

  const search =
    (
      $("driverApplicationSearch")
        ?.value ||
      ""
    )
      .trim()
      .toLowerCase();

  const statusFilter =
    (
      $("driverApplicationStatusFilter")
        ?.value ||
      ""
    )
      .trim()
      .toLowerCase();

  const filtered =
    driverApplications.filter(
      application => {

        const searchable =
          [
            application.full_name,
            application.phone,
            application.email,
            application.postcode,
            application.taxi_badge_number,
            application.driving_licence_number,
            application.status
          ]
            .join(" ")
            .toLowerCase();

        const matchesSearch =
          searchable.includes(
            search
          );

        const matchesStatus =
          !statusFilter ||
          String(
            application.status ||
            ""
          )
            .toLowerCase() ===
          statusFilter;

        return (
          matchesSearch &&
          matchesStatus
        );

      }
    );


  const submitted =
    driverApplications.filter(
      item =>
        item.status ===
        "submitted"
    ).length;

  const approved =
    driverApplications.filter(
      item =>
        item.status ===
        "approved"
    ).length;

  const rejected =
    driverApplications.filter(
      item =>
        item.status ===
        "rejected"
    ).length;

  const invited =
    driverApplications.filter(
      item =>
        item.status ===
        "invited"
    ).length;


  if (
    $("driverApplicationStats")
  ) {

    $("driverApplicationStats").innerHTML = `

      <div class="stat">
        <span>Submitted</span>
        <b>${submitted}</b>
      </div>

      <div class="stat">
        <span>Approved</span>
        <b>${approved}</b>
      </div>

      <div class="stat">
        <span>Rejected</span>
        <b>${rejected}</b>
      </div>

      <div class="stat">
        <span>Invited</span>
        <b>${invited}</b>
      </div>
    `;
  }


  updateDriverApplicationsNavCount();


  if (
    !filtered.length
  ) {

    container.innerHTML = `

      <div class="card">
        No driver applications found.
      </div>
    `;

    return;
  }


  container.innerHTML =
    filtered
      .map(
        application => {

          const docs =
            driverApplicationDocuments[
              application.id
            ] || [];

          return `

            <div class="vehicle-card">

              <div class="row">

                <div>

                  <h3>
                    ${escapeHtml(
                      application.full_name ||
                      "New Driver Invitation"
                    )}
                  </h3>

                  <div class="small">
                    ${escapeHtml(
                      application.email ||
                      ""
                    )}
                  </div>

                </div>

                <span
                  class="badge ${
                    applicationStatusClass(
                      application.status
                    )
                  }"
                >
                  ${
                    applicationStatusText(
                      application.status
                    )
                  }
                </span>

              </div>

              <hr>

              <p>
                <b>Phone:</b>
                ${escapeHtml(
                  application.phone ||
                  "-"
                )}
              </p>

              <p>
                <b>Postcode:</b>
                ${escapeHtml(
                  application.postcode ||
                  "-"
                )}
              </p>

              <p>
                <b>Taxi Badge:</b>
                ${escapeHtml(
                  application.taxi_badge_number ||
                  "-"
                )}
              </p>

              <p>
                <b>Licence Points:</b>
                ${
                  application.licence_points ??
                  "-"
                }
              </p>

              <p>
                <b>Uploaded Documents:</b>
                ${docs.length}
              </p>

              <button
                class="blue"
                onclick="viewDriverApplication('${application.id}')"
              >
                View Full Application
              </button>

              ${
                application.status ===
                "submitted"

                  ? `

                    <div class="actions">

                      <button
                        class="green"
                        onclick="approveDriverApplication('${application.id}')"
                      >
                        Approve
                      </button>

                      <button
                        class="danger"
                        onclick="rejectDriverApplication('${application.id}')"
                      >
                        Reject
                      </button>

                    </div>
                  `

                  : ""
              }

              ${
                application.status ===
                "rejected"

                  ? `

                    <button
                      class="danger"
                      onclick="removeRejectedDriverApplication('${application.id}')"
                    >
                      🗑 Remove Rejected Application
                    </button>
                  `

                  : ""
              }

            </div>
          `;

        }
      )
      .join("");
}


// ======================================================
// DETAIL ROW
// ======================================================

function detailRow(
  label,
  value
) {

  let displayValue =
    value;

  if (
    displayValue === null ||
    displayValue === undefined ||
    displayValue === ""
  ) {

    displayValue =
      "-";
  }

  return `

    <p>

      <b>
        ${escapeHtml(label)}:
      </b>

      ${escapeHtml(
        String(
          displayValue
        )
      )}

    </p>
  `;
}


// ======================================================
// VIEW FULL DRIVER APPLICATION
// ======================================================

function viewDriverApplication(
  applicationId
) {

  const application =
    driverApplications.find(
      item =>
        item.id ===
        applicationId
    );

  if (
    !application
  ) {

    alert(
      "Driver application could not be found."
    );

    return;
  }

  selectedDriverApplicationId =
    applicationId;

  const docs =
    driverApplicationDocuments[
      applicationId
    ] || [];

  showTab(
    "driverApplicationDetail"
  );

  const box =
    $("driverApplicationDetailBox");

  if (
    !box
  ) {
    return;
  }

  box.innerHTML = `

    <div class="vehicle-card">

      <div class="row">

        <div>

          <h2>
            ${escapeHtml(
              application.full_name ||
              "Driver Application"
            )}
          </h2>

        </div>

        <span
          class="badge ${
            applicationStatusClass(
              application.status
            )
          }"
        >
          ${
            applicationStatusText(
              application.status
            )
          }
        </span>

      </div>


      <hr>


      <h3>
        👤 Personal Details
      </h3>

      ${detailRow(
        "Full Name",
        application.full_name
      )}

      ${detailRow(
        "Date of Birth",
        formatDate(
          application.date_of_birth
        )
      )}

      ${detailRow(
        "Phone",
        application.phone
      )}

      ${detailRow(
        "Email",
        application.email
      )}

      ${detailRow(
        "National Insurance Number",
        application.national_insurance_number
      )}


      <hr>


      <h3>
        🏠 Address
      </h3>

      ${detailRow(
        "Address Line 1",
        application.address_line_1
      )}

      ${detailRow(
        "Address Line 2",
        application.address_line_2
      )}

      ${detailRow(
        "City",
        application.city
      )}

      ${detailRow(
        "Postcode",
        application.postcode
      )}


      <hr>


      <h3>
        🚘 Driving Licence
      </h3>

      ${detailRow(
        "Licence Number",
        application.driving_licence_number
      )}

      ${detailRow(
        "Licence Expiry",
        formatDate(
          application.driving_licence_expiry
        )
      )}

      ${detailRow(
        "Penalty Points",
        application.licence_points
      )}

      ${detailRow(
        "Points Details",
        application.licence_points_details
      )}


      <hr>


      <h3>
        🚕 Taxi / Private Hire
      </h3>

      ${detailRow(
        "Taxi Badge Number",
        application.taxi_badge_number
      )}

      ${detailRow(
        "Taxi Badge Expiry",
        formatDate(
          application.taxi_badge_expiry
        )
      )}


      <hr>


      <h3>
        💥 Accident History
      </h3>

      ${detailRow(
        "Accidents Last 5 Years",
        application.accidents_last_5_years
      )}

      ${detailRow(
        "Number of Accidents",
        application.accident_count
      )}

      ${detailRow(
        "Accident Details",
        application.accident_details
      )}


      <hr>


      <h3>
        ☎️ Emergency Contact
      </h3>

      ${detailRow(
        "Name",
        application.emergency_contact_name
      )}

      ${detailRow(
        "Phone",
        application.emergency_contact_phone
      )}


      <hr>


      <h3>
        📝 Additional Information
      </h3>

      ${detailRow(
        "Notes",
        application.notes
      )}


      <hr>


      <h3>
        📂 Uploaded Documents
      </h3>

      <div
        id="driverApplicationDocumentList"
      >

        ${
          docs.length

            ? docs
                .map(
                  document =>
                    driverDocumentCard(
                      document
                    )
                )
                .join("")

            : `

                <p class="small">
                  No uploaded documents.
                </p>
              `
        }

      </div>


      <hr>


      ${
        application.status ===
        "submitted"

          ? `

            <div class="actions">

              <button
                class="green"
                onclick="approveDriverApplication('${application.id}')"
              >
                ✅ Approve Driver
              </button>

              <button
                class="danger"
                onclick="rejectDriverApplication('${application.id}')"
              >
                ❌ Reject Application
              </button>

            </div>
          `

          : ""
      }


      ${
        application.status ===
        "rejected"

          ? `

            <button
              class="danger"
              onclick="removeRejectedDriverApplication('${application.id}')"
            >
              🗑 Remove Rejected Application
            </button>
          `

          : ""
      }


      ${
        application.status ===
        "approved"

          ? `

            <button
              class="danger"
              onclick="deleteApprovedDriver('${application.id}')"
            >
              🗑 Delete Driver
            </button>
          `

          : ""
      }

    </div>
  `;

  addApplicationContactButton();
}


// ======================================================
// OPEN DRIVER DOCUMENT
// ======================================================

async function openDriverDocument(
  documentId,
  downloadFile = true
) {

  const document =
    Object
      .values(
        driverApplicationDocuments
      )
      .flat()
      .find(
        item =>
          item.id ===
          documentId
      );

  if (
    !document
  ) {

    alert(
      "Document could not be found."
    );

    return;
  }

  try {

    const options =
      downloadFile
        ? {
            download:
              true
          }
        : {};

    const {
      data,
      error
    } =
      await sb.storage
        .from(
          "driver-onboarding"
        )
        .createSignedUrl(
          document.file_path,
          3600,
          options
        );

    if (
      error
    ) {
      throw error;
    }

    if (
      !data?.signedUrl
    ) {

      throw new Error(
        "Could not create document link."
      );
    }

    window.open(
      data.signedUrl,
      "_blank"
    );

  } catch (error) {

    console.error(
      "Open driver document:",
      error
    );

    alert(
      "Could not open document: " +
      error.message
    );
  }
}


// ======================================================
// VIEW PROPER SIGNED AGREEMENT
// ======================================================

async function viewSignedAgreement(
  applicationId
) {

  const application =
    driverApplications.find(
      item =>
        item.id === applicationId
    );

  if (!application) {

    alert(
      "Driver application could not be found."
    );

    return;
  }


  const docs =
    driverApplicationDocuments[
      applicationId
    ] || [];


  const agreementDoc =
    docs.find(
      item =>
        item.document_type ===
        "rental_agreement_acceptance"
    );


  const signatureDoc =
    docs.find(
      item =>
        item.document_type ===
        "rental_agreement_signature"
    );


  if (!agreementDoc) {

    alert(
      "Signed agreement record could not be found."
    );

    return;
  }


  try {

    // ==================================================
    // LOAD AGREEMENT RECORD
    // ==================================================

    const {
      data:
        agreementUrlData,
      error:
        agreementUrlError
    } =
      await sb.storage
        .from(
          "driver-onboarding"
        )
        .createSignedUrl(
          agreementDoc.file_path,
          3600
        );


    if (agreementUrlError) {
      throw agreementUrlError;
    }


    const agreementResponse =
      await fetch(
        agreementUrlData.signedUrl
      );


    if (!agreementResponse.ok) {

      throw new Error(
        "Could not read the signed agreement."
      );
    }


    const agreement =
      await agreementResponse.json();


    // ==================================================
    // LOAD SIGNATURE IMAGE
    // ==================================================

    let signatureUrl =
      "";


    if (signatureDoc) {

      const {
        data:
          signatureData,
        error:
          signatureError
      } =
        await sb.storage
          .from(
            "driver-onboarding"
          )
          .createSignedUrl(
            signatureDoc.file_path,
            3600
          );


      if (!signatureError) {

        signatureUrl =
          signatureData?.signedUrl ||
          "";
      }
    }


    // ==================================================
    // OPEN PRINTABLE AGREEMENT
    // ==================================================

    const agreementWindow =
      window.open(
        "",
        "_blank"
      );


    if (!agreementWindow) {

      alert(
        "Please allow pop-ups to view the signed agreement."
      );

      return;
    }


    agreementWindow.document.write(`

<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width, initial-scale=1"
>

<title>
  Signed Rental Agreement
</title>


<style>

body {

  font-family:
    Arial,
    Helvetica,
    sans-serif;

  max-width:
    850px;

  margin:
    0 auto;

  padding:
    28px;

  color:
    #111827;

  line-height:
    1.55;

  background:
    white;
}


h1 {

  margin:
    0;

  text-align:
    center;

  color:
    #123d73;
}


.company-info {

  text-align:
    center;

  margin-top:
    8px;

  margin-bottom:
    28px;

  color:
    #475467;
}


.title {

  text-align:
    center;

  font-size:
    22px;

  font-weight:
    bold;

  text-decoration:
    underline;

  margin-bottom:
    25px;
}


.details {

  border:
    1px solid #cfd4dc;

  border-radius:
    10px;

  padding:
    16px;

  margin-bottom:
    22px;
}


.details p {

  margin:
    7px 0;
}


.term {

  margin-bottom:
    18px;
}


.term h3 {

  margin-bottom:
    5px;

  font-size:
    17px;
}


.term p {

  margin:
    5px 0;
}


.accepted {

  margin-top:
    25px;

  padding:
    14px;

  border:
    1px solid #86d6a4;

  background:
    #ecfdf3;

  border-radius:
    10px;

  font-weight:
    bold;
}


.signature {

  margin-top:
    28px;

  border-top:
    2px solid #111827;

  padding-top:
    20px;
}


.signature img {

  display:
    block;

  max-width:
    420px;

  width:
    100%;

  margin-top:
    12px;

  border:
    1px solid #d0d5dd;

  border-radius:
    10px;
}


.print-button {

  margin-top:
    30px;

  width:
    100%;

  padding:
    14px;

  border:
    none;

  border-radius:
    9px;

  background:
    #101828;

  color:
    white;

  font-size:
    17px;

  font-weight:
    bold;
}


@media print {

  body {

    max-width:
      none;

    padding:
      0;

    font-size:
      11pt;
  }


  .print-button {

    display:
      none;
  }


  .term {

    break-inside:
      avoid;
  }


  .signature {

    break-inside:
      avoid;
  }
}

</style>

</head>


<body>


<h1>
  CARS 4 U 1 LIMITED
</h1>


<div class="company-info">

  01,112 Mavisbank Gardens,
  Glasgow G51 1HR

  <br>

  Company Number:
  SC331432

  <br>

  Consumer Credit License Number:
  629911

</div>


<div class="title">
  Private Hire Long Term Car Rental Agreement
</div>


<div class="details">

  <p>
    <b>Driver Name:</b>
    ${escapeHtml(
      agreement.driver_name ||
      application.full_name ||
      ""
    )}
  </p>


  <p>
    <b>Address:</b>
    ${escapeHtml(
      agreement.address ||
      ""
    )}
  </p>


  <p>
    <b>Contact:</b>
    ${escapeHtml(
      agreement.phone ||
      application.phone ||
      ""
    )}
  </p>


  <p>
    <b>Email:</b>
    ${escapeHtml(
      agreement.email ||
      application.email ||
      ""
    )}
  </p>

</div>


<h2>
  Terms and Conditions
</h2>


<div class="term">

  <h3>
    1. Parties
  </h3>

  <p>
    This agreement is between CAR 4 U 1 LTD
    ("the Company") and the driver named in
    this agreement ("the Driver").
  </p>

</div>


<div class="term">

  <h3>
    2. Vehicle Hire
  </h3>

  <p>
    The Company agrees to provide the Driver
    with a vehicle for private hire work,
    subject to availability, licensing,
    insurance requirements and the terms of
    this agreement.
  </p>

  <p>
    The specific vehicle registration,
    mileage, rental start date and other
    vehicle details may be recorded by the
    Company when a vehicle is assigned.
  </p>

</div>


<div class="term">

  <h3>
    3. Rental Payments
  </h3>

  <p>
    The Driver agrees to pay the agreed
    vehicle rental charge at the frequency
    and amount agreed with CAR 4 U 1 LTD.
  </p>

  <p>
    Rental payments must be made on time.
    Any unpaid rental, charges or other sums
    due may be recorded as an outstanding
    balance.
  </p>

</div>


<div class="term">

  <h3>
    4. Deposit
  </h3>

  <p>
    Where a deposit is required, the Driver
    agrees to pay the amount requested by
    the Company.
  </p>

  <p>
    Subject to applicable law, the deposit
    may be applied towards sums properly due
    under this agreement, including unpaid
    rental or damage for which the Driver is
    responsible.
  </p>

</div>


<div class="term">

  <h3>
    5. Vehicle Condition
  </h3>

  <p>
    The Driver must take reasonable care of
    the vehicle and keep it in a clean and
    roadworthy condition.
  </p>

  <p>
    Warning lights, mechanical problems,
    damage, tyre problems or safety concerns
    must be reported promptly.
  </p>

</div>


<div class="term">

  <h3>
    6. Daily Checks
  </h3>

  <p>
    The Driver is responsible for carrying
    out reasonable routine checks before
    using the vehicle, including tyres,
    lights, fluid levels where appropriate
    and obvious safety defects.
  </p>

</div>


<div class="term">

  <h3>
    7. Authorised Driver
  </h3>

  <p>
    Only a person authorised by CAR 4 U 1 LTD
    and properly covered by the relevant
    insurance and licensing requirements may
    drive the vehicle.
  </p>

</div>


<div class="term">

  <h3>
    8. Private Hire Use
  </h3>

  <p>
    The Driver must hold all licences,
    badges and permissions required by the
    relevant licensing authority and comply
    with the applicable private hire
    conditions.
  </p>

</div>


<div class="term">

  <h3>
    9. Insurance
  </h3>

  <p>
    The Driver must comply with all
    conditions of the applicable motor
    insurance policy.
  </p>

  <p>
    The Driver must immediately inform the
    Company of penalty points, convictions,
    accidents, licence restrictions or other
    changes that could affect insurance.
  </p>

</div>


<div class="term">

  <h3>
    10. Driving Behaviour
  </h3>

  <p>
    The Driver must operate the vehicle
    safely and responsibly and comply with
    road traffic law.
  </p>

  <p>
    Dangerous driving, excessive speeding,
    harsh braking, aggressive acceleration
    or other unacceptable driving behaviour
    may result in action by the Company.
  </p>

</div>


<div class="term">

  <h3>
    11. Accidents and Damage
  </h3>

  <p>
    Any accident, collision, theft,
    vandalism or damage involving the vehicle
    must be reported to CAR 4 U 1 LTD as soon
    as reasonably possible.
  </p>

</div>


<div class="term">

  <h3>
    12. Insurance Excess
  </h3>

  <p>
    Where an insurance excess or other charge
    is properly payable by the Driver
    following an incident, the Driver agrees
    to pay the applicable amount subject to
    the insurance policy and applicable law.
  </p>

</div>


<div class="term">

  <h3>
    13. Fines and Penalties
  </h3>

  <p>
    The Driver is responsible for fines,
    penalties, parking charges, toll charges
    and similar charges arising from their
    use of the vehicle where legally
    applicable.
  </p>

</div>


<div class="term">

  <h3>
    14. Fuel
  </h3>

  <p>
    Unless otherwise agreed, the Driver is
    responsible for fuel used during the
    rental period and must use the correct
    fuel for the vehicle.
  </p>

</div>


<div class="term">

  <h3>
    15. Smoking
  </h3>

  <p>
    Smoking or vaping inside the vehicle is
    not permitted where prohibited by law,
    licensing conditions or Company policy.
  </p>

</div>


<div class="term">

  <h3>
    16. Illegal Use
  </h3>

  <p>
    The vehicle must not be used for any
    unlawful purpose, racing, deliberate
    misuse or activity that would invalidate
    insurance or breach licensing
    requirements.
  </p>

</div>


<div class="term">

  <h3>
    17. Maintenance and Repairs
  </h3>

  <p>
    The Driver must not arrange substantial
    repairs, modifications or alterations
    without prior authorisation from
    CAR 4 U 1 LTD except where immediate
    action is reasonably necessary for safety.
  </p>

</div>


<div class="term">

  <h3>
    18. Servicing, MOT and Inspections
  </h3>

  <p>
    The Driver must make the vehicle
    available when reasonably requested for
    servicing, MOT testing, licensing
    inspections, repairs, tyre replacement,
    recalls or other necessary work.
  </p>

</div>


<div class="term">

  <h3>
    19. Vehicle Documents
  </h3>

  <p>
    Documents supplied by the Company
    relating to the vehicle, insurance or
    private hire licensing must be kept
    secure and used only for their intended
    purpose.
  </p>

</div>


<div class="term">

  <h3>
    20. Change of Circumstances
  </h3>

  <p>
    The Driver must promptly notify
    CAR 4 U 1 LTD of material changes to
    contact details, address, driving licence,
    penalty points, taxi/private hire badge,
    licensing status or insurance-related
    circumstances.
  </p>

</div>


<div class="term">

  <h3>
    21. Return of Vehicle
  </h3>

  <p>
    When the rental ends, the Driver must
    return the vehicle, keys and any Company
    property or vehicle documents in
    accordance with arrangements made with
    CAR 4 U 1 LTD.
  </p>

</div>


<div class="term">

  <h3>
    22. Ending the Rental
  </h3>

  <p>
    Either party may end the rental in
    accordance with any notice period
    separately agreed between the parties
    and subject to applicable law.
  </p>

</div>


<div class="term">

  <h3>
    23. Serious Breach
  </h3>

  <p>
    The Company may require the vehicle to
    be returned immediately where reasonably
    necessary because of a serious breach,
    loss of insurance or licensing
    eligibility, unlawful use or serious
    safety concerns.
  </p>

</div>


<div class="term">

  <h3>
    24. Information Provided by Driver
  </h3>

  <p>
    The Driver confirms that the information
    provided in the application is true and
    accurate to the best of their knowledge.
  </p>

</div>


<div class="term">

  <h3>
    25. Electronic Documents
  </h3>

  <p>
    The Driver agrees that documents relating
    to the rental may be provided
    electronically, including by email,
    secure web link or messaging service.
  </p>

</div>


<div class="term">

  <h3>
    26. Electronic Signature
  </h3>

  <p>
    By signing electronically and selecting
    the acceptance checkbox, the Driver
    intends to sign this agreement and
    confirms agreement to its terms.
  </p>

</div>


<div class="term">

  <h3>
    27. Data and Records
  </h3>

  <p>
    CAR 4 U 1 LTD may retain information and
    documents reasonably required to
    administer the rental, licensing,
    insurance, compliance and related
    business records, subject to applicable
    data protection law.
  </p>

</div>


<div class="term">

  <h3>
    28. Governing Law
  </h3>

  <p>
    This agreement is governed by the law of
    Scotland and disputes will be subject to
    the jurisdiction of the Scottish courts
    where applicable.
  </p>

</div>


<div class="term">

  <h3>
    29. Entire Agreement
  </h3>

  <p>
    This document, together with any
    vehicle-specific rental details
    subsequently recorded and other terms
    expressly agreed between the parties,
    forms the agreement relating to the
    vehicle rental.
  </p>

</div>


<div class="term">

  <h3>
    30. Driver Confirmation
  </h3>

  <p>
    By signing below, the Driver confirms
    that they had the opportunity to read
    this agreement, understand its contents
    and agree to be bound by its terms.
  </p>

</div>


<div class="accepted">

  ✓ I have read and agreed to the
  CAR 4 U 1 LTD Private Hire Long Term
  Car Rental Agreement and its terms
  and conditions.

</div>


<div class="signature">

  <h2>
    Electronic Signature
  </h2>


  <p>
    <b>Signed by:</b>

    ${escapeHtml(
      agreement.signed_name ||
      application.full_name ||
      ""
    )}
  </p>


  <p>
    <b>Date Signed:</b>

    ${escapeHtml(
      agreement.signed_date ||
      ""
    )}
  </p>


  ${
    signatureUrl

      ? `

          <img
            src="${signatureUrl}"
            alt="Driver Electronic Signature"
          >
        `

      : `

          <p>
            Signature image unavailable.
          </p>
        `
  }

</div>


<button
  class="print-button"
  onclick="window.print()"
>
  Print / Save as PDF
</button>


</body>

</html>

    `);


    agreementWindow.document.close();


  } catch (error) {

    console.error(
      "View signed agreement:",
      error
    );


    alert(
      "Could not open signed agreement: " +
      error.message
    );
  }
}


// ======================================================
// REMOVE REJECTED APPLICATION
// ======================================================

async function removeRejectedDriverApplication(
  applicationId
) {

  const application =
    driverApplications.find(
      item =>
        item.id ===
        applicationId
    );

  if (
    !application
  ) {

    alert(
      "Application could not be found."
    );

    return;
  }

  if (
    String(
      application.status ||
      ""
    )
      .toLowerCase() !==
    "rejected"
  ) {

    alert(
      "Only rejected applications can be removed."
    );

    return;
  }

  const name =
    application.full_name ||
    "this rejected application";

  if (
    !confirm(
      `Remove ${name} permanently?\n\nThis will also delete its uploaded documents and signature.`
    )
  ) {
    return;
  }

  try {

    const {
      data:
        applicationDocs,
      error:
        docsError
    } =
      await sb
        .from(
          "driver_application_documents"
        )
        .select(
          "id,file_path"
        )
        .eq(
          "application_id",
          applicationId
        );

    if (
      docsError
    ) {
      throw docsError;
    }

    const filePaths =
      (
        applicationDocs ||
        []
      )
        .map(
          item =>
            item.file_path
        )
        .filter(
          Boolean
        );

    if (
      filePaths.length
    ) {

      const {
        error:
          storageError
      } =
        await sb.storage
          .from(
            "driver-onboarding"
          )
          .remove(
            filePaths
          );

      if (
        storageError
      ) {
        throw storageError;
      }
    }

    const {
      error:
        deleteDocsError
    } =
      await sb
        .from(
          "driver_application_documents"
        )
        .delete()
        .eq(
          "application_id",
          applicationId
        );

    if (
      deleteDocsError
    ) {
      throw deleteDocsError;
    }

    const {
      data:
        deletedRows,
      error:
        deleteApplicationError
    } =
      await sb
        .from(
          "driver_applications"
        )
        .delete()
        .eq(
          "id",
          applicationId
        )
        .eq(
          "status",
          "rejected"
        )
        .select(
          "id"
        );

    if (
      deleteApplicationError
    ) {
      throw deleteApplicationError;
    }

    if (
      !deletedRows ||
      deletedRows.length !== 1
    ) {

      throw new Error(
        "Safety stop: exactly one rejected application should be removed."
      );
    }

    selectedDriverApplicationId =
      null;

    await loadDriverApplications(
      false,
      true
    );

    renderDrivers();

    renderDriverApplications();

    alert(
      "Rejected application removed successfully."
    );

    showTab(
      "driverApplications"
    );

  } catch (error) {

    console.error(
      "Remove rejected application:",
      error
    );

    alert(
      "Could not remove rejected application: " +
      error.message
    );
  }
}


// ======================================================
// NAV COUNT
// ======================================================

function updateDriverApplicationsNavCount() {

  const button =
    $("driverApplicationsNavButton");

  if (
    !button
  ) {
    return;
  }

  const waiting =
    driverApplications.filter(
      application =>
        application.status ===
        "submitted"
    ).length;

  button.innerText =
    waiting > 0
      ? `Driver Applications (${waiting})`
      : "Driver Applications";
}


// ======================================================
// END PART 3 OF 5
// ======================================================// ======================================================
// CAR 4 U 1 LTD - FLEET MANAGER V8
// PART 4A OF 5
// APPROVE / REJECT + APPROVED DRIVERS
// ======================================================


// ======================================================
// APPROVE DRIVER APPLICATION
// ======================================================

async function approveDriverApplication(
  applicationId
) {

  const application =
    driverApplications.find(
      item =>
        item.id === applicationId
    );

  if (!application) {

    alert(
      "Driver application could not be found."
    );

    return;
  }

  if (
    application.status !==
    "submitted"
  ) {

    alert(
      "Only submitted applications can be approved."
    );

    return;
  }

  if (
    !confirm(
      `Approve ${application.full_name || "this driver"}?`
    )
  ) {
    return;
  }

  try {

    const {
      data,
      error
    } =
      await sb
        .from(
          "driver_applications"
        )
.update({

  status:
    "approved"

})
 

        })
        .eq(
          "id",
          applicationId
        )
        .eq(
          "status",
          "submitted"
        )
        .select("*");

    if (error) {
      throw error;
    }

    if (
      !data ||
      data.length !== 1
    ) {

      throw new Error(
        "The application could not be approved."
      );
    }

    selectedDriverApplicationId =
      applicationId;

    await loadDriverApplications(
      false,
      true
    );

    renderDrivers();
    renderDriverApplications();

    alert(
      `${application.full_name || "Driver"} approved successfully.`
    );

    openAssignVehicleModal(
      applicationId
    );

  } catch (error) {

    console.error(
      "Approve driver:",
      error
    );

    alert(
      "Could not approve driver: " +
      error.message
    );
  }
}


// ======================================================
// REJECT DRIVER APPLICATION
// ======================================================

async function rejectDriverApplication(
  applicationId
) {

  const application =
    driverApplications.find(
      item =>
        item.id === applicationId
    );

  if (!application) {

    alert(
      "Driver application could not be found."
    );

    return;
  }

  if (
    application.status !==
    "submitted"
  ) {

    alert(
      "Only submitted applications can be rejected."
    );

    return;
  }

  const reason =
    prompt(
      "Reason for rejecting this application:"
    );

  if (
    reason === null
  ) {
    return;
  }

  if (
    !reason.trim()
  ) {

    alert(
      "Please enter a rejection reason."
    );

    return;
  }

  if (
    !confirm(
      `Reject ${application.full_name || "this application"}?`
    )
  ) {
    return;
  }

  try {

    const {
      data,
      error
    } =
      await sb
        .from(
          "driver_applications"
        )
        .update({

  status:
    "rejected"

})

        })
        .eq(
          "id",
          applicationId
        )
        .eq(
          "status",
          "submitted"
        )
        .select("*");

    if (error) {
      throw error;
    }

    if (
      !data ||
      data.length !== 1
    ) {

      throw new Error(
        "The application could not be rejected."
      );
    }

    selectedDriverApplicationId =
      null;

    await loadDriverApplications(
      false,
      true
    );

    renderDrivers();
    renderDriverApplications();

    alert(
      "Application rejected."
    );

    showTab(
      "driverApplications"
    );

  } catch (error) {

    console.error(
      "Reject driver:",
      error
    );

    alert(
      "Could not reject application: " +
      error.message
    );
  }
}


// ======================================================
// RENDER APPROVED DRIVERS
// ======================================================

function renderDrivers() {

  const container =
    $("driverList");

  if (!container) {
    return;
  }

  const approved =
    driverApplications.filter(
      application =>
        application.status ===
        "approved"
    );

  if (
    !approved.length
  ) {

    container.innerHTML = `

      <div class="card">
        No approved drivers yet.
      </div>
    `;

    return;
  }

  container.innerHTML =
    approved
      .map(
        driver => {

          const assignedVehicle =
            fleet.find(
              car =>
                car.driver_application_id ===
                driver.id
            ) ||
            fleet.find(
              car =>
                (
                  car.driver_phone &&
                  driver.phone &&
                  normalisePhone(
                    car.driver_phone
                  ) ===
                  normalisePhone(
                    driver.phone
                  )
                )
            );

          return `

            <div class="vehicle-card">

              <div class="row">

                <div>

                  <h3>
                    ${escapeHtml(
                      driver.full_name ||
                      "Approved Driver"
                    )}
                  </h3>

                  <div class="small">
                    ${escapeHtml(
                      driver.email ||
                      ""
                    )}
                  </div>

                </div>

                <span class="badge">
                  Approved
                </span>

              </div>

              <hr>

              <p>
                <b>Phone:</b>
                ${escapeHtml(
                  driver.phone ||
                  "-"
                )}
              </p>

              <p>
                <b>Taxi Badge:</b>
                ${escapeHtml(
                  driver.taxi_badge_number ||
                  "-"
                )}
              </p>

              <p>
                <b>Badge Expiry:</b>
                ${
                  driver.taxi_badge_expiry
                    ? formatDate(
                        driver.taxi_badge_expiry
                      )
                    : "-"
                }
              </p>

              <p>
                <b>Assigned Vehicle:</b>

                ${
                  assignedVehicle
                    ? escapeHtml(
                        `${
                          assignedVehicle.registration ||
                          ""
                        } ${
                          assignedVehicle.make_model ||
                          ""
                        }`
                      )
                    : "Not assigned"
                }
              </p>

              <div class="actions">

                <button
                  class="blue"
                  onclick="viewDriverApplication('${driver.id}')"
                >
                  View Driver
                </button>

                <button
                  class="green"
                  onclick="openAssignVehicleModal('${driver.id}')"
                >
                  ${
                    assignedVehicle
                      ? "Change Vehicle"
                      : "Assign Vehicle"
                  }
                </button>

                ${
                  driver.phone

                    ? `

                      <button
                        class="blue"
                        onclick="contactApprovedDriver('${driver.id}')"
                      >
                        WhatsApp
                      </button>
                    `

                    : ""
                }

                <button
                  class="danger"
                  onclick="deleteApprovedDriver('${driver.id}')"
                >
                  Delete Driver
                </button>

              </div>

            </div>
          `;

        }
      )
      .join("");
}


// ======================================================
// NORMALISE PHONE
// ======================================================

function normalisePhone(
  phone
) {

  let value =
    String(
      phone ||
      ""
    )
      .replace(
        /[^0-9]/g,
        ""
      );

  if (
    value.startsWith(
      "0044"
    )
  ) {

    value =
      "44" +
      value.substring(
        4
      );
  }

  if (
    value.startsWith(
      "0"
    )
  ) {

    value =
      "44" +
      value.substring(
        1
      );
  }

  return value;
}


// ======================================================
// CONTACT APPROVED DRIVER
// ======================================================

function contactApprovedDriver(
  applicationId
) {

  const driver =
    driverApplications.find(
      item =>
        item.id ===
        applicationId
    );

  if (
    !driver
  ) {
    return;
  }

  const phone =
    normalisePhone(
      driver.phone
    );

  if (!phone) {

    alert(
      "No phone number saved for this driver."
    );

    return;
  }

  const message =
    encodeURIComponent(
      `Hi ${driver.full_name || ""}, this is Car 4 U 1 Ltd regarding your driver account.`
    );

  window.open(
    `https://wa.me/${phone}?text=${message}`,
    "_blank"
  );
}


// ======================================================
// APPLICATION CONTACT BUTTON
// ======================================================

function addApplicationContactButton() {

  const box =
    $("driverApplicationDetailBox");

  if (!box) {
    return;
  }

  if (
    box.querySelector(
      "#applicationContactButton"
    )
  ) {
    return;
  }

  const application =
    driverApplications.find(
      item =>
        item.id ===
        selectedDriverApplicationId
    );

  if (
    !application?.phone
  ) {
    return;
  }

  const button =
    document.createElement(
      "button"
    );

  button.id =
    "applicationContactButton";

  button.className =
    "blue";

  button.innerText =
    "💬 WhatsApp Driver";

  button.onclick =
    function() {

      const phone =
        normalisePhone(
          application.phone
        );

      if (!phone) {

        alert(
          "No valid phone number."
        );

        return;
      }

      const message =
        encodeURIComponent(
          `Hi ${application.full_name || ""}, this is Car 4 U 1 Ltd regarding your driver application.`
        );

      window.open(
        `https://wa.me/${phone}?text=${message}`,
        "_blank"
      );
    };

  box.appendChild(
    button
  );
}


// ======================================================
// ASSIGN VEHICLE MODAL
// ======================================================

function openAssignVehicleModal(
  applicationId
) {

  const driver =
    driverApplications.find(
      item =>
        item.id ===
        applicationId
    );

  if (!driver) {

    alert(
      "Driver could not be found."
    );

    return;
  }

  lastAssignedDriverApplicationId =
    applicationId;

  let modal =
    $("assignVehicleModal");

  if (!modal) {

    modal =
      document.createElement(
        "div"
      );

    modal.id =
      "assignVehicleModal";

    modal.style.cssText = `
      position:fixed;
      inset:0;
      background:rgba(0,0,0,.60);
      z-index:10100;
      padding:20px;
      overflow:auto;
    `;

    modal.innerHTML = `

      <div
        style="
          max-width:600px;
          margin:40px auto;
          background:white;
          border-radius:20px;
          padding:22px;
        "
      >

        <h2>
          🚗 Assign Vehicle
        </h2>

        <p id="assignVehicleDriverName">
        </p>

        <label>
          <b>Select Vehicle</b>
        </label>

        <select
          id="assignVehicleSelect"
        >
        </select>

        <label>
          Weekly Rent
        </label>

        <input
          id="assignVehicleRent"
          type="number"
          min="0"
          step="0.01"
          placeholder="Weekly rent"
        >

        <label>
          Deposit
        </label>

        <input
          id="assignVehicleDeposit"
          type="number"
          min="0"
          step="0.01"
          placeholder="Deposit"
        >

        <button
          class="green"
          onclick="confirmVehicleAssignment()"
        >
          Assign Vehicle
        </button>

        <button
          class="secondary"
          onclick="closeAssignVehicleModal()"
        >
          Cancel
        </button>

      </div>
    `;

    document.body.appendChild(
      modal
    );
  }

  $("assignVehicleDriverName").innerHTML =
    `Assigning vehicle to <b>${
      escapeHtml(
        driver.full_name ||
        "Driver"
      )
    }</b>`;

  const availableCars =
    fleet.filter(
      car =>
        !car.driver_name ||
        String(
          car.status ||
          ""
        )
          .toLowerCase() ===
        "available" ||
        car.driver_application_id ===
        applicationId
    );

  const select =
    $("assignVehicleSelect");

  if (
    !availableCars.length
  ) {

    select.innerHTML = `

      <option value="">
        No available vehicles
      </option>
    `;

  } else {

    select.innerHTML =
      availableCars
        .map(
          car => `

            <option value="${car.id}">
              ${escapeHtml(
                car.registration ||
                ""
              )}
              -
              ${escapeHtml(
                car.make_model ||
                ""
              )}
            </option>
          `
        )
        .join("");
  }

  if (
    availableCars.length
  ) {

    $("assignVehicleRent").value =
      availableCars[0]
        .weekly_rent ||
      "";

    $("assignVehicleDeposit").value =
      availableCars[0]
        .deposit ||
      "";
  }

  select.onchange =
    function() {

      const car =
        fleet.find(
          item =>
            item.id ===
            select.value
        );

      if (!car) {
        return;
      }

      $("assignVehicleRent").value =
        car.weekly_rent ||
        "";

      $("assignVehicleDeposit").value =
        car.deposit ||
        "";
    };

  modal.style.display =
    "block";
}


// ======================================================
// CLOSE ASSIGN VEHICLE
// ======================================================

function closeAssignVehicleModal() {

  const modal =
    $("assignVehicleModal");

  if (modal) {

    modal.style.display =
      "none";
  }
}


// ======================================================
// END PART 4A OF 5
// CONTINUE DIRECTLY WITH PART 4B
// ======================================================// ======================================================
// CAR 4 U 1 LTD - FLEET MANAGER V8
// PART 4B OF 5
// VEHICLE ASSIGNMENT + DELETE APPROVED DRIVER + INVITES
// ======================================================


// ======================================================
// CONFIRM VEHICLE ASSIGNMENT
// ======================================================

async function confirmVehicleAssignment() {

  const applicationId =
    lastAssignedDriverApplicationId;

  const vehicleId =
    $("assignVehicleSelect")
      ?.value;

  if (
    !applicationId ||
    !vehicleId
  ) {

    alert(
      "Please select a vehicle."
    );

    return;
  }

  const driver =
    driverApplications.find(
      item =>
        item.id ===
        applicationId
    );

  const vehicle =
    fleet.find(
      item =>
        item.id ===
        vehicleId
    );

  if (
    !driver ||
    !vehicle
  ) {

    alert(
      "Driver or vehicle could not be found."
    );

    return;
  }

  const weeklyRent =
    Number(
      $("assignVehicleRent")
        ?.value ||
      0
    );

  const deposit =
    Number(
      $("assignVehicleDeposit")
        ?.value ||
      0
    );

  try {

    const {
      data,
      error
    } =
      await sb
        .from(
          "vehicles"
        )
        .update({

          driver_name:
            driver.full_name ||
            "",

          driver_phone:
            driver.phone ||
            "",

          weekly_rent:
            weeklyRent,

          deposit:
            deposit,

          status:
            "Rented",

          driver_application_id:
            driver.id

        })
        .eq(
          "id",
          vehicleId
        )
        .select("*");

    if (error) {
      throw error;
    }

    if (
      !data ||
      data.length !== 1
    ) {

      throw new Error(
        "Vehicle assignment was not confirmed."
      );
    }

    lastAssignedVehicleId =
      vehicleId;

    closeAssignVehicleModal();

    await loadVehicles();

    render();

    alert(
      `${driver.full_name || "Driver"} has been assigned to ${vehicle.registration || "the vehicle"}.`
    );

  } catch (error) {

    console.error(
      "Assign vehicle:",
      error
    );

    alert(
      "Could not assign vehicle: " +
      error.message
    );
  }
}


// ======================================================
// DELETE APPROVED DRIVER
// ======================================================

async function deleteApprovedDriver(
  applicationId
) {

  const driver =
    driverApplications.find(
      item =>
        item.id ===
        applicationId
    );

  if (!driver) {

    alert(
      "Driver could not be found."
    );

    return;
  }

  if (
    driver.status !==
    "approved"
  ) {

    alert(
      "Only approved drivers can be removed from the Drivers section."
    );

    return;
  }

  const assignedCars =
    fleet.filter(
      car =>
        car.driver_application_id ===
        applicationId
    );

  let message =
    `Delete ${driver.full_name || "this driver"}?`;

  if (
    assignedCars.length
  ) {

    message +=
      "\n\nTheir assigned vehicle will be marked Available.";
  }

  message +=
    "\n\nTheir application and uploaded documents will also be permanently removed.";

  if (
    !confirm(
      message
    )
  ) {
    return;
  }

  try {

    // -----------------------------------------------
    // UNASSIGN VEHICLES
    // -----------------------------------------------

    for (
      const car of assignedCars
    ) {

      const {
        error:
          vehicleError
      } =
        await sb
          .from(
            "vehicles"
          )
          .update({

            driver_name:
              "",

            driver_phone:
              "",

            status:
              "Available",

            driver_application_id:
              null

          })
          .eq(
            "id",
            car.id
          );

      if (
        vehicleError
      ) {
        throw vehicleError;
      }
    }


    // -----------------------------------------------
    // GET DRIVER DOCUMENTS
    // -----------------------------------------------

    const {
      data:
        applicationDocs,
      error:
        docsError
    } =
      await sb
        .from(
          "driver_application_documents"
        )
        .select(
          "id,file_path"
        )
        .eq(
          "application_id",
          applicationId
        );

    if (
      docsError
    ) {
      throw docsError;
    }

    const filePaths =
      (
        applicationDocs ||
        []
      )
        .map(
          item =>
            item.file_path
        )
        .filter(
          Boolean
        );


    // -----------------------------------------------
    // DELETE STORAGE FILES
    // -----------------------------------------------

    if (
      filePaths.length
    ) {

      const {
        error:
          storageError
      } =
        await sb.storage
          .from(
            "driver-onboarding"
          )
          .remove(
            filePaths
          );

      if (
        storageError
      ) {
        throw storageError;
      }
    }


    // -----------------------------------------------
    // DELETE DOCUMENT ROWS
    // -----------------------------------------------

    const {
      error:
        documentDeleteError
    } =
      await sb
        .from(
          "driver_application_documents"
        )
        .delete()
        .eq(
          "application_id",
          applicationId
        );

    if (
      documentDeleteError
    ) {
      throw documentDeleteError;
    }


    // -----------------------------------------------
    // DELETE DRIVER APPLICATION
    // -----------------------------------------------

    const {
      data:
        deletedRows,
      error:
        driverDeleteError
    } =
      await sb
        .from(
          "driver_applications"
        )
        .delete()
        .eq(
          "id",
          applicationId
        )
        .eq(
          "status",
          "approved"
        )
        .select(
          "id"
        );

    if (
      driverDeleteError
    ) {
      throw driverDeleteError;
    }

    if (
      !deletedRows ||
      deletedRows.length !== 1
    ) {

      throw new Error(
        "Safety stop: exactly one approved driver should be deleted."
      );
    }

    selectedDriverApplicationId =
      null;

    await Promise.all([

      loadVehicles(),

      loadDriverApplications(
        false,
        true
      )

    ]);

    render();

    alert(
      "Driver removed successfully."
    );

    showTab(
      "drivers"
    );

  } catch (error) {

    console.error(
      "Delete approved driver:",
      error
    );

    alert(
      "Could not delete driver: " +
      error.message
    );
  }
}


// ======================================================
// DRIVER INVITATION BUTTON
// ======================================================

function addDriverInvitationButton() {

  const section =
    $("driverApplications");

  if (
    !section ||
    $("createDriverInvitationButton")
  ) {
    return;
  }

  const panel =
    section.querySelector(
      ".panel"
    );

  if (!panel) {
    return;
  }

  const button =
    document.createElement(
      "button"
    );

  button.id =
    "createDriverInvitationButton";

  button.className =
    "green";

  button.style.marginBottom =
    "15px";

  button.innerText =
    "➕ Invite New Driver";

  button.onclick =
    openDriverInvitationModal;

  const search =
    $("driverApplicationSearch");

  if (
    search
  ) {

    search.insertAdjacentElement(
      "beforebegin",
      button
    );

  } else {

    panel.prepend(
      button
    );
  }
}


// ======================================================
// DRIVER INVITATION MODAL
// ======================================================

function openDriverInvitationModal() {

  let modal =
    $("driverInvitationModal");

  if (!modal) {

    modal =
      document.createElement(
        "div"
      );

    modal.id =
      "driverInvitationModal";

    modal.style.cssText = `
      position:fixed;
      inset:0;
      background:rgba(0,0,0,.60);
      z-index:10200;
      padding:20px;
      overflow:auto;
    `;

    modal.innerHTML = `

      <div
        style="
          max-width:600px;
          margin:40px auto;
          background:white;
          border-radius:20px;
          padding:22px;
        "
      >

        <h2>
          👨‍✈️ Invite New Driver
        </h2>

        <p class="small">
          Create a secure onboarding link and send it to the driver.
        </p>

        <label>
          Driver Name
        </label>

        <input
          id="inviteDriverName"
          type="text"
          placeholder="Driver name"
        >

        <label>
          Mobile Number
        </label>

        <input
          id="inviteDriverPhone"
          type="tel"
          placeholder="07..."
        >

        <label>
          Email
        </label>

        <input
          id="inviteDriverEmail"
          type="email"
          placeholder="Optional email"
        >

        <button
          id="createDriverInviteConfirmButton"
          class="green"
          onclick="createDriverInvitation()"
        >
          Create Invitation
        </button>

        <button
          class="secondary"
          onclick="closeDriverInvitationModal()"
        >
          Cancel
        </button>

        <div
          id="driverInvitationResult"
          style="margin-top:18px;"
        ></div>

      </div>
    `;

    document.body.appendChild(
      modal
    );
  }

  $("inviteDriverName").value =
    "";

  $("inviteDriverPhone").value =
    "";

  $("inviteDriverEmail").value =
    "";

  $("driverInvitationResult").innerHTML =
    "";

  modal.style.display =
    "block";
}


// ======================================================
// CLOSE DRIVER INVITATION
// ======================================================

function closeDriverInvitationModal() {

  const modal =
    $("driverInvitationModal");

  if (modal) {

    modal.style.display =
      "none";
  }
}


// ======================================================
// RANDOM TOKEN
// ======================================================

function createInvitationToken() {

  if (
    typeof crypto !==
      "undefined" &&
    crypto.randomUUID
  ) {

    return (
      crypto.randomUUID() +
      "-" +
      crypto.randomUUID()
    );
  }

  return (
    Date.now()
      .toString(36) +
    "-" +
    Math.random()
      .toString(36)
      .slice(2) +
    "-" +
    Math.random()
      .toString(36)
      .slice(2)
  );
}


// ======================================================
// CREATE DRIVER INVITATION
// ======================================================

async function createDriverInvitation() {

  const name =
    $("inviteDriverName")
      ?.value
      .trim() ||
    "";

  const phone =
    $("inviteDriverPhone")
      ?.value
      .trim() ||
    "";

  const email =
    $("inviteDriverEmail")
      ?.value
      .trim() ||
    "";

  if (!name) {

    alert(
      "Please enter the driver's name."
    );

    return;
  }

  if (!phone) {

    alert(
      "Please enter the driver's mobile number."
    );

    return;
  }

  const button =
    $("createDriverInviteConfirmButton");

  if (button) {

    button.disabled =
      true;

    button.innerText =
      "Creating...";
  }

  try {

    const token =
      createInvitationToken();

    const {
      data,
      error
    } =
      await sb
        .from(
          "driver_applications"
        )
        .insert({

          manager_id:
            currentUser?.id ||
            null,

          full_name:
            name,

          phone:
            phone,

          email:
            email,

          status:
            "invited",

          application_token:
            token

        })
        .select("*")
        .single();

    if (error) {
      throw error;
    }

    const onboardingUrl =
      `${window.location.origin}/driver-onboarding.html?token=${encodeURIComponent(token)}`;

    const result =
      $("driverInvitationResult");

    if (
      result
    ) {

      result.innerHTML = `

        <div class="card">

          <h3>
            Invitation Ready
          </h3>

          <p>
            <b>
              ${escapeHtml(
                name
              )}
            </b>
          </p>

          <input
            id="generatedDriverInvitationLink"
            value="${escapeHtml(onboardingUrl)}"
            readonly
          >

          <button
            class="blue"
            onclick="copyDriverInvitationLink()"
          >
            Copy Link
          </button>

          <button
            class="green"
            onclick="sendDriverInvitationWhatsApp('${data.id}')"
          >
            Send by WhatsApp
          </button>

        </div>
      `;
    }

    await loadDriverApplications(
      false,
      true
    );

    renderDriverApplications();

  } catch (error) {

    console.error(
      "Create driver invitation:",
      error
    );

    alert(
      "Could not create invitation: " +
      error.message
    );

  } finally {

    if (button) {

      button.disabled =
        false;

      button.innerText =
        "Create Invitation";
    }
  }
}


// ======================================================
// COPY DRIVER INVITATION LINK
// ======================================================

async function copyDriverInvitationLink() {

  const input =
    $("generatedDriverInvitationLink");

  if (!input) {
    return;
  }

  try {

    if (
      navigator.clipboard &&
      window.isSecureContext
    ) {

      await navigator.clipboard
        .writeText(
          input.value
        );

      alert(
        "Driver invitation link copied."
      );

      return;
    }

  } catch (_) {}


  input.focus();

  input.select();

  input.setSelectionRange(
    0,
    input.value.length
  );

  alert(
    "The invitation link is selected. Tap Copy."
  );
}


// ======================================================
// SEND DRIVER INVITATION BY WHATSAPP
// ======================================================

function sendDriverInvitationWhatsApp(
  applicationId
) {

  const application =
    driverApplications.find(
      item =>
        item.id ===
        applicationId
    );

  if (!application) {

    alert(
      "Driver invitation could not be found."
    );

    return;
  }

  const token =
    application.application_token;

  if (!token) {

    alert(
      "Invitation token is missing."
    );

    return;
  }

  const phone =
    normalisePhone(
      application.phone
    );

  if (!phone) {

    alert(
      "Driver phone number is missing."
    );

    return;
  }

  const onboardingUrl =
    `${window.location.origin}/driver-onboarding.html?token=${encodeURIComponent(token)}`;

  const message =
    encodeURIComponent(
`Hi ${application.full_name || ""},

You have been invited to complete your driver onboarding for CAR 4 U 1 LTD.

Please complete your details, upload your required documents, read the rental agreement and sign electronically using this secure link:

${onboardingUrl}

Thank you,
CAR 4 U 1 LTD`
    );

  window.open(
    `https://wa.me/${phone}?text=${message}`,
    "_blank"
  );
}


// ======================================================
// END PART 4B OF 5
// ======================================================// ======================================================
// CAR 4 U 1 LTD - FLEET MANAGER V8
// PART 5 OF 5
// REPORTS + REMINDERS + REFRESH + AUTH + FINAL STARTUP
// ======================================================


// ======================================================
// REPORT
// ======================================================

function report() {

  const container =
    $("reportContent");

  if (!container) {
    return;
  }

  const alerts =
    buildAlerts();

  const totalWeeklyRent =
    fleet.reduce(
      (total, car) =>
        total +
        Number(
          car.weekly_rent || 0
        ),
      0
    );

  const totalOutstanding =
    fleet.reduce(
      (total, car) =>
        total +
        Number(
          car.outstanding || 0
        ),
      0
    );

  const totalExpenses =
    Object
      .values(expenses)
      .flat()
      .reduce(
        (total, item) =>
          total +
          Number(
            item.amount || 0
          ),
        0
      );

  const rented =
    fleet.filter(
      car =>
        String(
          car.status || ""
        ).toLowerCase() ===
        "rented"
    ).length;

  const available =
    fleet.filter(
      car =>
        String(
          car.status || ""
        ).toLowerCase() ===
        "available"
    ).length;

  const approvedDrivers =
    driverApplications.filter(
      driver =>
        driver.status ===
        "approved"
    ).length;

  const waitingDrivers =
    driverApplications.filter(
      driver =>
        driver.status ===
        "submitted"
    ).length;

  container.innerHTML = `

    <div class="stats">

      <div class="stat">
        <span>Total Vehicles</span>
        <b>${fleet.length}</b>
      </div>

      <div class="stat">
        <span>Rented</span>
        <b>${rented}</b>
      </div>

      <div class="stat">
        <span>Available</span>
        <b>${available}</b>
      </div>

      <div class="stat">
        <span>Weekly Rent</span>
        <b>
          £${totalWeeklyRent.toFixed(2)}
        </b>
      </div>

      <div class="stat">
        <span>Outstanding</span>
        <b>
          £${totalOutstanding.toFixed(2)}
        </b>
      </div>

      <div class="stat">
        <span>Total Expenses</span>
        <b>
          £${totalExpenses.toFixed(2)}
        </b>
      </div>

      <div class="stat">
        <span>Approved Drivers</span>
        <b>${approvedDrivers}</b>
      </div>

      <div class="stat">
        <span>Applications Waiting</span>
        <b>${waitingDrivers}</b>
      </div>

      <div class="stat">
        <span>Compliance Alerts</span>
        <b>${alerts.length}</b>
      </div>

    </div>


    <div class="card">

      <h3>
        Compliance Alerts
      </h3>

      ${
        alerts.length

          ? alerts
              .map(
                alert => `

                  <p>

                    <b>
                      ${escapeHtml(
                        alert.registration
                      )}
                    </b>

                    —
                    ${escapeHtml(
                      alert.label
                    )}

                    —

                    ${
                      alert.days < 0
                        ? `${Math.abs(alert.days)} days overdue`
                        : `${alert.days} days remaining`
                    }

                  </p>
                `
              )
              .join("")

          : `

              <p>
                No urgent compliance alerts.
              </p>
            `
      }

    </div>
  `;
}


// ======================================================
// ADD BALANCE
// ======================================================

async function addBalance(
  vehicleId
) {

  const car =
    fleet.find(
      item =>
        item.id ===
        vehicleId
    );

  if (!car) {
    return;
  }

  const value =
    prompt(
      `Add outstanding balance for ${car.registration}:`
    );

  if (
    value === null
  ) {
    return;
  }

  const amount =
    Number(value);

  if (
    !Number.isFinite(amount)
  ) {

    alert(
      "Please enter a valid amount."
    );

    return;
  }

  const newBalance =
    Number(
      car.outstanding || 0
    ) +
    amount;

  try {

    const {
      error
    } =
      await sb
        .from("vehicles")
        .update({
          outstanding:
            newBalance
        })
        .eq(
          "id",
          vehicleId
        );

    if (error) {
      throw error;
    }

    await loadVehicles();

    render();

  } catch (error) {

    console.error(
      "Add balance:",
      error
    );

    alert(
      "Could not update balance: " +
      error.message
    );
  }
}


// ======================================================
// MARK WEEKLY RENT PAID
// ======================================================

async function markPaid(
  vehicleId
) {

  const car =
    fleet.find(
      item =>
        item.id ===
        vehicleId
    );

  if (!car) {
    return;
  }

  if (
    !confirm(
      `Mark weekly rent paid for ${car.registration}?`
    )
  ) {
    return;
  }

  try {

    const {
      error
    } =
      await sb
        .from("vehicles")
        .update({

          outstanding:
            Math.max(
              0,
              Number(
                car.outstanding || 0
              ) -
              Number(
                car.weekly_rent || 0
              )
            ),

          last_paid:
            new Date()
              .toISOString()

        })
        .eq(
          "id",
          vehicleId
        );

    if (error) {
      throw error;
    }

    await loadVehicles();

    render();

    alert(
      "Payment marked as paid."
    );

  } catch (error) {

    console.error(
      "Mark paid:",
      error
    );

    alert(
      "Could not update payment: " +
      error.message
    );
  }
}


// ======================================================
// DRIVER REMINDER
// ======================================================

function sendDriverReminder(
  vehicleId
) {

  const car =
    fleet.find(
      item =>
        item.id ===
        vehicleId
    );

  if (!car) {
    return;
  }

  const phone =
    normalisePhone(
      car.driver_phone
    );

  if (!phone) {

    alert(
      "No driver phone number saved."
    );

    return;
  }

  const outstanding =
    Number(
      car.outstanding || 0
    );

  let message =
    `Hi ${car.driver_name || ""},

This is a reminder from CAR 4 U 1 LTD regarding vehicle ${car.registration || ""}.`;

  if (
    outstanding > 0
  ) {

    message += `

Outstanding balance: £${outstanding.toFixed(2)}.`;
  }

  message += `

Thank you,
CAR 4 U 1 LTD`;

  window.open(
    `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
    "_blank"
  );
}


// ======================================================
// OWNER COPY
// ======================================================

function sendOwnerCopy(
  vehicleId
) {

  const car =
    fleet.find(
      item =>
        item.id ===
        vehicleId
    );

  if (!car) {
    return;
  }

  const ownerPhone =
    normalisePhone(
      OWNER_PHONE
    );

  if (!ownerPhone) {
    return;
  }

  const message =
`CAR 4 U 1 LTD Fleet Update

Vehicle: ${car.registration || ""}
Driver: ${car.driver_name || "No driver"}
Weekly Rent: £${Number(car.weekly_rent || 0).toFixed(2)}
Outstanding: £${Number(car.outstanding || 0).toFixed(2)}
Status: ${car.status || ""}`;

  window.open(
    `https://wa.me/${ownerPhone}?text=${encodeURIComponent(message)}`,
    "_blank"
  );
}


// ======================================================
// SEND VEHICLE DOCUMENT TO DRIVER
// ======================================================

async function sendVehicleDocumentToDriver(
  documentId
) {

  const allDocuments =
    Object
      .values(documents)
      .flat();

  const document =
    allDocuments.find(
      item =>
        item.id ===
        documentId
    );

  if (!document) {

    alert(
      "Document could not be found."
    );

    return;
  }

  const car =
    fleet.find(
      item =>
        item.id ===
        document.vehicle_id
    );

  if (!car) {

    alert(
      "Vehicle could not be found."
    );

    return;
  }

  const phone =
    normalisePhone(
      car.driver_phone
    );

  if (!phone) {

    alert(
      "No driver phone number saved."
    );

    return;
  }

  try {

    const {
      data,
      error
    } =
      await sb.storage
        .from(
          "vehicle-documents"
        )
        .createSignedUrl(
          document.file_path,
          86400
        );

    if (error) {
      throw error;
    }

    if (
      !data?.signedUrl
    ) {

      throw new Error(
        "Could not create document link."
      );
    }

    const message =
`Hi ${car.driver_name || ""},

CAR 4 U 1 LTD has sent you a document for vehicle ${car.registration || ""}.

Document:
${vehicleDocumentLabel(document.document_type)}

Open document:
${data.signedUrl}

This link is temporary.

Thank you,
CAR 4 U 1 LTD`;

    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
      "_blank"
    );

  } catch (error) {

    console.error(
      "Send document:",
      error
    );

    alert(
      "Could not send document: " +
      error.message
    );
  }
}


// ======================================================
// ENHANCE VEHICLE DOCUMENT LIST
// ======================================================

function addVehicleDocumentSendButtons() {

  const container =
    $("vehicleDocumentsList");

  if (
    !container ||
    !selectedVehicleDocumentVehicleId
  ) {
    return;
  }

  const list =
    documents[
      selectedVehicleDocumentVehicleId
    ] || [];

  container.innerHTML =
    list.length

      ? list
          .map(
            document => `

              <div class="card">

                <h3>
                  ${escapeHtml(
                    vehicleDocumentLabel(
                      document.document_type
                    )
                  )}
                </h3>

                <p class="small">
                  ${escapeHtml(
                    document.file_name ||
                    ""
                  )}
                </p>

                <button
                  class="blue"
                  onclick="viewVehicleDocument('${document.id}')"
                >
                  View / Download
                </button>

                <button
                  class="green"
                  onclick="sendVehicleDocumentToDriver('${document.id}')"
                >
                  Send to Driver
                </button>

                <button
                  class="danger"
                  onclick="deleteVehicleDocument('${document.id}')"
                >
                  Delete Document
                </button>

              </div>
            `
          )
          .join("")

      : `

          <div class="card">
            No vehicle documents uploaded yet.
          </div>
        `;
}


// ======================================================
// WRAP VEHICLE DOCUMENT RENDER
// ======================================================

const originalRenderVehicleDocumentsList =
  renderVehicleDocumentsList;

renderVehicleDocumentsList =
  function() {

    originalRenderVehicleDocumentsList();

    addVehicleDocumentSendButtons();
  };


// ======================================================
// REFRESH BUTTON
// ======================================================

function addRefreshButton() {

  if (
    $("globalRefreshButton")
  ) {
    return;
  }

  const app =
    $("app");

  if (!app) {
    return;
  }

  const button =
    document.createElement(
      "button"
    );

  button.id =
    "globalRefreshButton";

  button.className =
    "blue";

  button.innerText =
    "🔄 Refresh";

  button.style.cssText = `
    position:fixed;
    right:15px;
    bottom:15px;
    width:auto;
    z-index:9000;
    box-shadow:0 4px 14px rgba(0,0,0,.25);
  `;

  button.onclick =
    async function() {

      if (
        refreshInProgress
      ) {
        return;
      }

      button.disabled =
        true;

      button.innerText =
        "Refreshing...";

      try {

        await refreshAll();

        button.innerText =
          "✓ Updated";

        setTimeout(
          () => {

            button.innerText =
              "🔄 Refresh";

          },
          1200
        );

      } catch (error) {

        console.error(
          error
        );

        button.innerText =
          "🔄 Refresh";

      } finally {

        button.disabled =
          false;
      }
    };

  app.appendChild(
    button
  );
}


// ======================================================
// PREVENT ACCIDENTAL DOUBLE TAPS
// ======================================================

document.addEventListener(
  "click",
  function(event) {

    const button =
      event.target.closest(
        "button"
      );

    if (!button) {
      return;
    }

    const now =
      Date.now();

    if (
      now -
      lastButtonTap <
      250
    ) {

      event.preventDefault();

      event.stopPropagation();

      return;
    }

    lastButtonTap =
      now;

  },
  true
);


// ======================================================
// ONLINE / OFFLINE STATUS
// ======================================================

function showConnectionStatus(
  online
) {

  let indicator =
    $("connectionStatus");

  if (!indicator) {

    indicator =
      document.createElement(
        "div"
      );

    indicator.id =
      "connectionStatus";

    indicator.style.cssText = `
      position:fixed;
      left:12px;
      bottom:12px;
      z-index:8999;
      padding:7px 11px;
      border-radius:10px;
      font-size:12px;
      font-weight:bold;
      background:white;
      box-shadow:0 2px 10px rgba(0,0,0,.15);
    `;

    document.body.appendChild(
      indicator
    );
  }

  if (online) {

    indicator.innerText =
      "● Online";

  } else {

    indicator.innerText =
      "● Offline";
  }
}


window.addEventListener(
  "online",
  async function() {

    showConnectionStatus(
      true
    );

    if (
      currentUser
    ) {

      await refreshAll();
    }
  }
);


window.addEventListener(
  "offline",
  function() {

    showConnectionStatus(
      false
    );
  }
);


// ======================================================
// AUTH STATE LISTENER
// ======================================================

sb.auth.onAuthStateChange(
  async (
    event,
    session
  ) => {

    if (
      event ===
      "SIGNED_OUT"
    ) {

      currentUser =
        null;

      currentProfile =
        null;

      showLogin();

      return;
    }

    if (
      session?.user &&
      (
        event ===
          "SIGNED_IN" ||
        event ===
          "TOKEN_REFRESHED"
      )
    ) {

      currentUser =
        session.user;

      if (
        event ===
        "SIGNED_IN"
      ) {

        await loadProfile();

        showApp();

        await refreshAll();

        addRefreshButton();
      }
    }
  }
);


// ======================================================
// REFRESH WHEN APP RETURNS TO FOREGROUND
// ======================================================

document.addEventListener(
  "visibilitychange",
  async function() {

    if (
      document.visibilityState !==
      "visible"
    ) {
      return;
    }

    if (
      !currentUser
    ) {
      return;
    }

    const now =
      Date.now();

    if (
      now -
      lastRefreshTime <
      10000
    ) {
      return;
    }

    await refreshAll();
  }
);


// ======================================================
// SEARCH VEHICLES LIVE
// ======================================================

document.addEventListener(
  "input",
  function(event) {

    if (
      event.target?.id ===
      "vehicleSearch"
    ) {

      renderVehicles();
    }
  }
);


// ======================================================
// DRIVER TAB BUTTON
// ======================================================

function ensureDriversNavigation() {

  const nav =
    document.querySelector(
      "nav.tabs"
    );

  if (
    !nav ||
    $("approvedDriversNavButton")
  ) {
    return;
  }

  const button =
    document.createElement(
      "button"
    );

  button.id =
    "approvedDriversNavButton";

  button.innerText =
    "Approved Drivers";

  button.onclick =
    function() {

      showTab(
        "drivers"
      );

      renderDrivers();
    };

  nav.appendChild(
    button
  );
}


// ======================================================
// CREATE DRIVERS TAB IF MISSING
// ======================================================

function ensureDriversSection() {

  if (
    $("drivers")
  ) {
    return;
  }

  const app =
    $("app");

  if (!app) {
    return;
  }

  const section =
    document.createElement(
      "section"
    );

  section.id =
    "drivers";

  section.className =
    "tab hidden";

  section.innerHTML = `

    <div class="panel">

      <h2>
        👨‍✈️ Approved Drivers
      </h2>

      <p class="small">
        Approved drivers and vehicle assignments.
      </p>

      <div
        id="driverList"
      ></div>

    </div>
  `;

  app.appendChild(
    section
  );
}


// ======================================================
// FINAL APP SETUP
// ======================================================

function finalAppSetup() {

  ensureDriversSection();

  ensureDriversNavigation();

  ensureDriverApplicationsUI();

  addRefreshButton();

  showConnectionStatus(
    navigator.onLine
  );

  if (
    currentUser
  ) {

    render();
  }
}


// ======================================================
// RUN FINAL SETUP
// ======================================================

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    function() {

      finalAppSetup();

    }
  );

} else {

  finalAppSetup();
}


// ======================================================
// SAFETY ERROR LOGGING
// ======================================================

window.addEventListener(
  "error",
  function(event) {

    console.error(
      "CAR 4 U 1 APP ERROR:",
      event.error ||
      event.message
    );
  }
);


window.addEventListener(
  "unhandledrejection",
  function(event) {

    console.error(
      "CAR 4 U 1 PROMISE ERROR:",
      event.reason
    );
  }
);


// ======================================================
// CAR 4 U 1 LTD
// FLEET MANAGER V8
// COMPLETE APP.JS
// END PART 5 OF 5
// ======================================================
