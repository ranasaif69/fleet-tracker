// ======================================================
// CAR 4 U 1 LTD - FLEET MANAGER V8
// CLEAN CLOUD VERSION - SUPABASE
// PART 1 OF 4
// ======================================================

const SUPABASE_URL =
  "https://ugsxnraeivhluhpzuful.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_tBBhN_wybueoX75Copcd2w_f5s9w4b7";

const OWNER_PHONE = "447426053788";
const OWNER_NAME = "Sufyan";

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


// ======================================================
// START APP
// ======================================================

document.addEventListener(
  "DOMContentLoaded",
  async function () {

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

  if ($("createAccountBtn")) {
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

    console.error(error);

    showLogin();

    if ($("loginMessage")) {

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
      .trim();

  const password =
    $("loginPassword")
      ?.value;

  if (!email || !password) {

    if ($("loginMessage")) {

      $("loginMessage").innerText =
        "Please enter your email and password.";

    }

    return;
  }

  $("loginMessage").innerText =
    "Signing in...";

  try {

    const {
      data,
      error
    } =
      await sb.auth
        .signInWithPassword({

          email,
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

    $("loginMessage").innerText =
      "";

  } catch (error) {

    console.error(error);

    $("loginMessage").innerText =
      error.message;

  }
}


// ======================================================
// CREATE ADMIN ACCOUNT
// ======================================================

async function createAccount() {

  const email =
    $("loginEmail")
      ?.value
      .trim();

  const password =
    $("loginPassword")
      ?.value;

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

  $("loginMessage").innerText =
    "Creating account...";

  try {

    const {
      data,
      error
    } =
      await sb.auth.signUp({

        email,
        password,

        options: {

          data: {
            name: OWNER_NAME
          }

        }

      });

    if (error) {
      throw error;
    }

    if (data.session) {

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

    $("loginMessage").innerText =
      "Account created. Check your email, confirm it, then return and log in.";

  } catch (error) {

    console.error(error);

    $("loginMessage").innerText =
      error.message;

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

  currentUser = null;
  currentProfile = null;

  fleet = [];
  expenses = {};
  documents = {};

  driverApplications = [];
  driverApplicationDocuments = {};

  showLogin();
}


// ======================================================
// LOAD PROFILE
// ======================================================

async function loadProfile() {

  if (!currentUser) {
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

      console.error(error);

    }

    if (data) {

      currentProfile = data;

      return;
    }

    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          500
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
      tab =>
        tab.classList.add(
          "hidden"
        )
    );

  const selected =
    $(name);

  if (selected) {

    selected.classList.remove(
      "hidden"
    );

  }

  if (name === "reports") {

    report();

  }

  if (name === "drivers") {

    renderDrivers();

  }
}


// ======================================================
// REFRESH ALL DATA
// ======================================================

async function refreshAll() {

  if (!currentUser) {
    return;
  }

  try {

    await loadVehicles();

    await loadExpenses();

    await loadDocuments();

    await loadDriverApplications(
      false,
      true
    );

    render();

  } catch (error) {

    console.error(error);

    alert(
      "Could not refresh cloud data: " +
      error.message
    );

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
          ascending: true
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

  editVehicleId = null;

  if ($("vehicleFormTitle")) {

    $("vehicleFormTitle").innerText =
      "Add Vehicle";

  }

  [
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
  ].forEach(
    id => {

      if ($(id)) {

        $(id).value = "";

      }

    }
  );

  if ($("status")) {

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

  if (!currentUser) {

    alert(
      "Please login first."
    );

    return;
  }

  const registration =
    $("plate")
      .value
      .trim()
      .toUpperCase();

  if (!registration) {

    alert(
      "Please enter the vehicle registration."
    );

    return;
  }

  const car = {

    manager_id:
      currentUser.id,

    registration,

    make_model:
      $("model")
        .value
        .trim(),

    year:
      $("year")
        .value
        .trim() ||
      null,

    mileage:
      $("mileage").value
        ? Number(
            $("mileage").value
          )
        : null,

    driver_name:
      $("driver")
        .value
        .trim(),

    driver_phone:
      $("phone")
        .value
        .trim(),

    weekly_rent:
      Number(
        $("rent").value ||
        0
      ),

    deposit:
      Number(
        $("deposit").value ||
        0
      ),

    outstanding:
      Number(
        $("balance").value ||
        0
      ),

    mot_expiry:
      $("mot").value ||
      null,

    tax_expiry:
      $("tax").value ||
      null,

    insurance_expiry:
      $("insurance").value ||
      null,

    inspection_expiry:
      $("inspection").value ||
      null,

    service_due:
      $("service").value ||
      null,

    licence_expiry:
      $("licence").value ||
      null,

    badge_expiry:
      $("badge").value ||
      null,

    status:
      $("status").value,

    notes:
      $("notes")
        .value
        .trim()

  };

  try {

    let result;

    if (editVehicleId) {

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

    if (result.error) {
      throw result.error;
    }

    editVehicleId = null;

    await refreshAll();

    showTab(
      "vehicles"
    );

    alert(
      "Vehicle saved to cloud."
    );

  } catch (error) {

    console.error(error);

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
      vehicle =>
        vehicle.id === id
    );

  if (!car) {
    return;
  }

  editVehicleId = id;

  $("vehicleFormTitle").innerText =
    "Edit Vehicle";

  $("plate").value =
    car.registration || "";

  $("model").value =
    car.make_model || "";

  $("year").value =
    car.year || "";

  $("mileage").value =
    car.mileage || "";

  $("driver").value =
    car.driver_name || "";

  $("phone").value =
    car.driver_phone || "";

  $("rent").value =
    car.weekly_rent || "";

  $("deposit").value =
    car.deposit || "";

  $("balance").value =
    car.outstanding || "";

  $("mot").value =
    car.mot_expiry || "";

  $("tax").value =
    car.tax_expiry || "";

  $("insurance").value =
    car.insurance_expiry || "";

  $("inspection").value =
    car.inspection_expiry || "";

  $("service").value =
    car.service_due || "";

  $("licence").value =
    car.licence_expiry || "";

  $("badge").value =
    car.badge_expiry || "";

  $("status").value =
    car.status || "Rented";

  $("notes").value =
    car.notes || "";

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
        );

    if (error) {
      throw error;
    }

    await refreshAll();

  } catch (error) {

    alert(
      "Could not delete vehicle: " +
      error.message
    );

  }
}


// ======================================================
// END PART 1 OF 4
// ======================================================
// ======================================================
// CAR 4 U 1 LTD - FLEET MANAGER V8
// PART 2 OF 4
// EXPENSES + VEHICLE DOCUMENTS + DASHBOARD + VEHICLES
// ======================================================


// ======================================================
// EXPENSES
// ======================================================

async function loadExpenses() {

  const {
    data,
    error
  } =
    await sb
      .from("expenses")
      .select("*")
      .order("created_at", {
        ascending: false
      });

  if (error) {
    throw error;
  }

  expenses = {};

  (data || []).forEach(
    item => {

      const id =
        item.vehicle_id ||
        "general";

      if (!expenses[id]) {
        expenses[id] = [];
      }

      expenses[id].push(item);

    }
  );
}


// ======================================================
// OPEN EXPENSE FORM
// ======================================================

function openExpenses(vehicleId) {

  expenseVehicleId =
    vehicleId;

  const car =
    fleet.find(
      item =>
        item.id === vehicleId
    );

  if (!car) {

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
      .trim() || "";

  const amount =
    Number(
      $("expenseAmount")
        ?.value || 0
    );

  const garage =
    $("expenseGarage")
      ?.value
      .trim() || "";

  const expenseDate =
    $("expenseDate")
      ?.value || null;

  const paidBy =
    $("expensePaidBy")
      ?.value || "Cash";

  if (
    !description ||
    amount <= 0
  ) {

    alert(
      "Please enter description and amount."
    );

    return;
  }

  try {

    const {
      error
    } =
      await sb
        .from("expenses")
        .insert({

          vehicle_id:
            expenseVehicleId,

          manager_id:
            currentUser.id,

          amount:
            amount,

          description:
            description,

          garage:
            garage,

          expense_date:
            expenseDate,

          paid_by:
            paidBy

        });

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

    console.error(error);

    alert(
      "Could not save expense: " +
      error.message
    );

  }
}


// ======================================================
// DELETE EXPENSE
// ======================================================

async function deleteExpense(expenseId) {

  if (
    !confirm(
      "Delete this expense?"
    )
  ) {
    return;
  }

  try {

    const {
      error
    } =
      await sb
        .from("expenses")
        .delete()
        .eq(
          "id",
          expenseId
        );

    if (error) {
      throw error;
    }

    await loadExpenses();

    render();

    alert(
      "Expense deleted."
    );

  } catch (error) {

    alert(
      "Could not delete expense: " +
      error.message
    );

  }
}


// ======================================================
// VEHICLE DOCUMENTS
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

    console.warn(error);

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
      ].push(item);

    }
  );
}


// ======================================================
// VEHICLE DOCUMENT LABELS
// ======================================================

function vehicleDocumentLabel(type) {

  const labels = {

    mot:
      "MOT Certificate",

    v5:
      "V5 / Logbook",

    insurance:
      "Insurance Certificate",

    insurance_certificate:
      "Insurance Certificate",

    taxi_licence:
      "Taxi / Private Hire Licence",

    taxi_license:
      "Taxi / Private Hire Licence",

    private_hire_licence:
      "Taxi / Private Hire Licence",

    private_hire_license:
      "Taxi / Private Hire Licence"

  };

  return (
    labels[type] ||
    type ||
    "Vehicle Document"
  );
}


// ======================================================
// SAFE FILE NAME
// ======================================================

function safeVehicleDocumentFileName(name) {

  return String(
    name || "document"
  )
    .replace(
      /[^a-zA-Z0-9._-]/g,
      "_"
    );
}


// ======================================================
// OPEN VEHICLE DOCUMENT MANAGER
// ======================================================

function openVehicleDocuments(vehicleId) {

  selectedVehicleDocumentVehicleId =
    vehicleId;

  const vehicle =
    fleet.find(
      item =>
        item.id === vehicleId
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
      document.createElement("div");

    modal.id =
      "vehicleDocumentsModal";

    modal.style.cssText =
      `
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

        <p>
          Upload the documents that should be available for the assigned driver.
        </p>

        <label>
          <b>Document Type</b>
        </label>

        <select
          id="vehicleDocumentType"
          style="
            width:100%;
            margin-top:8px;
            margin-bottom:15px;
          "
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

        <label>
          <b>Choose Document</b>
        </label>

        <input
          id="vehicleDocumentFile"
          type="file"
          accept="image/*,.pdf"
          style="
            width:100%;
            margin-top:8px;
            margin-bottom:15px;
          "
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

  $("vehicleDocumentFile").value =
    "";

  renderVehicleDocumentsList();

  modal.style.display =
    "block";
}


// ======================================================
// CLOSE DOCUMENT MANAGER
// ======================================================

function closeVehicleDocumentsModal() {

  const modal =
    $("vehicleDocumentsModal");

  if (modal) {
    modal.style.display = "none";
  }
}


// ======================================================
// UPLOAD VEHICLE DOCUMENT
// ======================================================

async function uploadVehicleDocument() {

  if (!selectedVehicleDocumentVehicleId) {

    alert(
      "No vehicle selected."
    );

    return;
  }

  if (!currentUser) {

    alert(
      "Please login first."
    );

    return;
  }

  const fileInput =
    $("vehicleDocumentFile");

  const file =
    fileInput
      ?.files?.[0];

  const documentType =
    $("vehicleDocumentType")
      ?.value;

  if (!file) {

    alert(
      "Please choose a document first."
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

    const safeName =
      safeVehicleDocumentFileName(
        file.name
      );

    const filePath =
      `${currentUser.id}/${selectedVehicleDocumentVehicleId}/${Date.now()}-${safeName}`;

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
            upsert: false
          }
        );

    if (uploadError) {
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
            currentUser.id,

          document_type:
            documentType,

          file_name:
            file.name,

          file_path:
            filePath

        });

    if (insertError) {

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

    fileInput.value =
      "";

    renderVehicleDocumentsList();

    renderVehicles();

    alert(
      `${vehicleDocumentLabel(documentType)} uploaded successfully.`
    );

  } catch (error) {

    console.error(error);

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
// RENDER VEHICLE DOCUMENTS
// ======================================================

function renderVehicleDocumentsList() {

  const container =
    $("vehicleDocumentsList");

  if (!container) {
    return;
  }

  const list =
    documents[
      selectedVehicleDocumentVehicleId
    ] || [];

  if (!list.length) {

    container.innerHTML =
      `
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
              View Document
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

async function viewVehicleDocument(documentId) {

  const document =
    Object
      .values(documents)
      .flat()
      .find(
        item =>
          item.id === documentId
      );

  if (!document) {

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
          300
        );

    if (error) {
      throw error;
    }

    if (
      !data ||
      !data.signedUrl
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

    alert(
      "Could not open document: " +
      error.message
    );

  }
}


// ======================================================
// DELETE VEHICLE DOCUMENT
// ======================================================

async function deleteVehicleDocument(documentId) {

  const document =
    Object
      .values(documents)
      .flat()
      .find(
        item =>
          item.id === documentId
      );

  if (!document) {
    return;
  }

  if (
    !confirm(
      `Delete ${vehicleDocumentLabel(document.document_type)}?`
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

    if (storageError) {
      console.warn(storageError);
    }

    const {
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
        );

    if (error) {
      throw error;
    }

    await loadDocuments();

    renderVehicleDocumentsList();

    renderVehicles();

  } catch (error) {

    alert(
      "Could not delete document: " +
      error.message
    );

  }
}


// ======================================================
// HELPERS
// ======================================================

function vehicleExpenseTotal(vehicleId) {

  return (
    expenses[
      vehicleId
    ] || []
  ).reduce(
    (
      total,
      item
    ) =>
      total +
      Number(
        item.amount || 0
      ),
    0
  );
}


function daysUntil(value) {

  if (!value) {
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

  if (!value) {
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
// ALERTS
// ======================================================

function buildAlerts() {

  const alerts = [];

  fleet.forEach(
    car => {

      const checks = [

        ["MOT", car.mot_expiry],

        ["Road Tax", car.tax_expiry],

        ["Insurance", car.insurance_expiry],

        ["Taxi Inspection", car.inspection_expiry],

        ["Taxi Licence", car.licence_expiry],

        ["Badge", car.badge_expiry]

      ];

      checks.forEach(
        ([label, date]) => {

          const days =
            daysUntil(date);

          if (
            days !== null &&
            days <= 30
          ) {

            alerts.push({

              registration:
                car.registration,

              label,
              date,
              days

            });

          }

        }
      );

    }
  );

  alerts.sort(
    (a, b) =>
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
          car.weekly_rent || 0
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
          car.outstanding || 0
        ),
      0
    );

  if ($("statTotal")) {
    $("statTotal").innerText = fleet.length;
  }

  if ($("statRented")) {

    $("statRented").innerText =
      fleet.filter(
        car =>
          String(
            car.status || ""
          ).toLowerCase() ===
          "rented"
      ).length;

  }

  if ($("statAvailable")) {

    $("statAvailable").innerText =
      fleet.filter(
        car =>
          String(
            car.status || ""
          ).toLowerCase() ===
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

    container.innerHTML =
      `
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
        ?.value || ""
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

    container.innerHTML =
      `
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
                    car.registration || ""
                  )}
                </h3>

                <div class="small">
                  ${escapeHtml(
                    car.make_model || ""
                  )}
                </div>

              </div>

              <span class="badge">
                ${escapeHtml(
                  car.status || ""
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
                car.weekly_rent || 0
              ).toFixed(2)}
            </p>

            <p>
              <b>Outstanding:</b>
              £${Number(
                car.outstanding || 0
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
                🧾 Add Expense
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

function sendWhatsApp(vehicleId) {

  const car =
    fleet.find(
      item =>
        item.id === vehicleId
    );

  if (!car) {
    return;
  }

  let phone =
    String(
      car.driver_phone || ""
    )
      .replace(
        /[^0-9]/g,
        ""
      );

  if (
    phone.startsWith("0")
  ) {

    phone =
      "44" +
      phone.substring(1);

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
// END PART 2 OF 4
// ======================================================
// ======================================================
// CAR 4 U 1 LTD - FLEET MANAGER V8
// PART 3 OF 4
// DRIVERS + DRIVER APPLICATIONS + ASSIGNMENT
// ======================================================


// ======================================================
// RENDER DRIVERS
// ======================================================

function renderDrivers() {

  const container =
    $("driverList");

  if (!container) {
    return;
  }

  const approvedDrivers =
    driverApplications.filter(
      application =>
        application.status ===
        "approved"
    );

  const legacyDrivers =
    fleet.filter(
      car =>
        car.driver_name
    );

  if (
    !approvedDrivers.length &&
    !legacyDrivers.length
  ) {

    container.innerHTML =
      `
        <div class="card">
          No approved drivers yet.
        </div>
      `;

    return;
  }

  let html = "";

  approvedDrivers.forEach(
    driver => {

      let assignedCar = null;

      if (
        driver.assigned_vehicle_id
      ) {

        assignedCar =
          fleet.find(
            car =>
              car.id ===
              driver.assigned_vehicle_id
          ) || null;

      }

      if (!assignedCar) {

        const driverPhone =
          String(
            driver.phone || ""
          )
            .replace(
              /[^0-9]/g,
              ""
            );

        assignedCar =
          fleet.find(
            car => {

              const carPhone =
                String(
                  car.driver_phone || ""
                )
                  .replace(
                    /[^0-9]/g,
                    ""
                  );

              const samePhone =
                driverPhone &&
                carPhone &&
                driverPhone ===
                carPhone;

              const sameName =
                driver.full_name &&
                car.driver_name &&
                driver.full_name
                  .trim()
                  .toLowerCase() ===
                car.driver_name
                  .trim()
                  .toLowerCase();

              return (
                samePhone ||
                sameName
              );

            }
          ) || null;

      }

      const docs =
        driverApplicationDocuments[
          driver.id
        ] || [];

      html += `

        <div class="vehicle-card">

          <div class="row">

            <div>

              <h3>
                ${escapeHtml(
                  driver.full_name ||
                  "Approved Driver"
                )}
              </h3>

              <p class="small">
                Approved Driver
              </p>

            </div>

            <span class="badge greenText">
              Approved
            </span>

          </div>

          <hr>

          <p>
            <b>Phone:</b>
            ${escapeHtml(
              driver.phone || "-"
            )}
          </p>

          <p>
            <b>Email:</b>
            ${escapeHtml(
              driver.email || "-"
            )}
          </p>

          <p>
            <b>Postcode:</b>
            ${escapeHtml(
              driver.postcode || "-"
            )}
          </p>

          <p>
            <b>Driving Licence:</b>
            ${escapeHtml(
              driver.driving_licence_number ||
              "-"
            )}
          </p>

          <p>
            <b>Licence Expiry:</b>
            ${escapeHtml(
              formatDate(
                driver.driving_licence_expiry
              )
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
            ${escapeHtml(
              formatDate(
                driver.taxi_badge_expiry
              )
            )}
          </p>

          <p>
            <b>Licence Points:</b>
            ${driver.licence_points ?? "-"}
          </p>

          <p>
            <b>Accidents Last 5 Years:</b>
            ${escapeHtml(
              driver.accidents_last_5_years ||
              "-"
            )}
          </p>

          <p>
            <b>Uploaded Documents:</b>
            ${docs.length}
          </p>

          <p>
            <b>Vehicle:</b>
            ${
              assignedCar
                ? escapeHtml(
                    assignedCar.registration
                  )
                : "Not assigned"
            }
          </p>

          <button
            class="blue"
            onclick="viewDriverApplication('${driver.id}')"
          >
            View Driver Profile & Documents
          </button>

          <button
            class="green"
            onclick="assignApprovedDriverToVehicle('${driver.id}')"
          >
            Assign to Vehicle
          </button>

          <button
            onclick="whatsappApplicationDriver('${driver.id}')"
          >
            WhatsApp Driver
          </button>

          <button
            class="danger"
            onclick="deleteApprovedDriver('${driver.id}')"
          >
            🗑 Delete Driver
          </button>

        </div>
      `;

    }
  );


  legacyDrivers.forEach(
    car => {

      const alreadyShown =
        approvedDrivers.some(
          driver => {

            if (
              driver.assigned_vehicle_id &&
              driver.assigned_vehicle_id ===
              car.id
            ) {
              return true;
            }

            const appPhone =
              String(
                driver.phone || ""
              )
                .replace(
                  /[^0-9]/g,
                  ""
                );

            const carPhone =
              String(
                car.driver_phone || ""
              )
                .replace(
                  /[^0-9]/g,
                  ""
                );

            const samePhone =
              appPhone &&
              carPhone &&
              appPhone ===
              carPhone;

            const sameName =
              driver.full_name &&
              car.driver_name &&
              driver.full_name
                .trim()
                .toLowerCase() ===
              car.driver_name
                .trim()
                .toLowerCase();

            return (
              samePhone ||
              sameName
            );

          }
        );

      if (alreadyShown) {
        return;
      }

      html += `

        <div class="card">

          <h3>
            ${escapeHtml(
              car.driver_name
            )}
          </h3>

          <p>
            Vehicle:
            <b>
              ${escapeHtml(
                car.registration || ""
              )}
            </b>
          </p>

          <p>
            ${escapeHtml(
              car.driver_phone || ""
            )}
          </p>

          <button
            class="blue"
            onclick="sendWhatsApp('${car.id}')"
          >
            WhatsApp Driver
          </button>

        </div>
      `;

    }
  );

  container.innerHTML = html;
}


// ======================================================
// ASSIGN DRIVER TO VEHICLE
// ======================================================

function assignApprovedDriverToVehicle(
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

  if (!fleet.length) {

    alert(
      "There are no vehicles in your fleet."
    );

    return;
  }

  let vehicleList =
    "Choose a vehicle:\n\n";

  fleet.forEach(
    (car, index) => {

      vehicleList +=
        `${index + 1}. ${car.registration || ""} - ${car.make_model || ""}`;

      if (car.driver_name) {

        vehicleList +=
          ` (Current driver: ${car.driver_name})`;

      }

      vehicleList += "\n";

    }
  );

  const choice =
    prompt(
      vehicleList
    );

  if (!choice) {
    return;
  }

  const vehicleIndex =
    Number(choice) - 1;

  if (
    !Number.isInteger(
      vehicleIndex
    ) ||
    vehicleIndex < 0 ||
    vehicleIndex >=
      fleet.length
  ) {

    alert(
      "Please enter a valid vehicle number."
    );

    return;
  }

  const vehicle =
    fleet[
      vehicleIndex
    ];

  confirmDriverVehicleAssignment(
    driver,
    vehicle
  );
}


// ======================================================
// CONFIRM VEHICLE ASSIGNMENT
// ======================================================

async function confirmDriverVehicleAssignment(
  driver,
  vehicle
) {

  let message =
    `Assign ${driver.full_name || "this driver"} to ` +
    `${vehicle.registration || "this vehicle"}?`;

  if (
    vehicle.driver_name &&
    String(
      vehicle.driver_name
    )
      .trim()
      .toLowerCase() !==
    String(
      driver.full_name || ""
    )
      .trim()
      .toLowerCase()
  ) {

    message +=
      `\n\nWARNING: ${vehicle.registration} is currently assigned to ` +
      `${vehicle.driver_name}. This will replace that driver.`;

  }

  if (
    !confirm(
      message
    )
  ) {
    return;
  }

  try {

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
            driver.full_name || "",

          driver_phone:
            driver.phone || "",

          licence_expiry:
            driver.driving_licence_expiry ||
            null,

          badge_expiry:
            driver.taxi_badge_expiry ||
            null,

          status:
            "Rented"

        })
        .eq(
          "id",
          vehicle.id
        );

    if (vehicleError) {
      throw vehicleError;
    }

    const {
      error:
        driverError
    } =
      await sb
        .from(
          "driver_applications"
        )
        .update({

          assigned_vehicle_id:
            vehicle.id,

          updated_at:
            new Date()
              .toISOString()

        })
        .eq(
          "id",
          driver.id
        );

    if (driverError) {
      throw driverError;
    }

    lastAssignedVehicleId =
      vehicle.id;

    lastAssignedDriverApplicationId =
      driver.id;

    await loadVehicles();

    await loadDriverApplications(
      false,
      true
    );

    render();

    showVehicleDocumentSendBox(
      driver,
      vehicle
    );

  } catch (error) {

    console.error(error);

    alert(
      "Could not assign driver to vehicle: " +
      error.message
    );

  }
}


// ======================================================
// DRIVER APPLICATION UI
// ======================================================

function ensureDriverApplicationsUI() {

  const nav =
    document.querySelector(
      "nav.tabs"
    );

  if (
    nav &&
    !$(
      "driverApplicationsNavButton"
    )
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
    !$(
      "driverApplications"
    )
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
              Review applications,
              documents and approvals.
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
    !$(
      "driverApplicationDetail"
    )
  ) {

    const section =
      document.createElement(
        "section"
      );

    section.id =
      "driverApplicationDetail";

    section.className =
      "tab hidden";

    section.innerHTML = `

      <div class="panel">

        <button
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
      section
    );
  }
}


// ======================================================
// LOAD DRIVER APPLICATIONS
// ======================================================

async function loadDriverApplications(
  showMessage = false,
  quiet = false
) {

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
            ascending: false
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

    if (showMessage) {

      alert(
        "Driver applications refreshed."
      );

    }

  } catch (error) {

    console.error(
      "Driver applications error:",
      error
    );

    if (!quiet) {

      const list =
        $("driverApplicationList");

      if (list) {

        list.innerHTML =
          `
            <div class="card red">
              ${escapeHtml(
                error.message
              )}
            </div>
          `;

      }

    }

  }
}


// ======================================================
// LOAD DRIVER APPLICATION DOCUMENTS
// ======================================================

async function loadDriverApplicationDocuments() {

  driverApplicationDocuments = {};

  if (
    !driverApplications.length
  ) {
    return;
  }

  const ids =
    driverApplications.map(
      item =>
        item.id
    );

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

  if (error) {

    console.error(error);

    return;
  }

  (data || []).forEach(
    document => {

      if (
        !driverApplicationDocuments[
          document.application_id
        ]
      ) {

        driverApplicationDocuments[
          document.application_id
        ] = [];

      }

      driverApplicationDocuments[
        document.application_id
      ].push(
        document
      );

    }
  );
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
// RENDER DRIVER APPLICATIONS
// ======================================================

function renderDriverApplications() {

  const container =
    $("driverApplicationList");

  if (!container) {
    return;
  }

  const search =
    (
      $("driverApplicationSearch")
        ?.value || ""
    )
      .trim()
      .toLowerCase();

  const filter =
    (
      $("driverApplicationStatusFilter")
        ?.value || ""
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

        const matchesFilter =
          !filter ||
          String(
            application.status || ""
          ).toLowerCase() ===
          filter;

        return (
          matchesSearch &&
          matchesFilter
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

    $("driverApplicationStats").innerHTML =
      `
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

  if (!filtered.length) {

    container.innerHTML =
      `
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
                      "Driver Invitation"
                    )}
                  </h3>

                  <p class="small">
                    ${escapeHtml(
                      application.email || ""
                    )}
                  </p>

                </div>

                <span class="badge">
                  ${escapeHtml(
                    application.status ||
                    "invited"
                  )}
                </span>

              </div>

              <hr>

              <p>
                <b>Phone:</b>
                ${escapeHtml(
                  application.phone || "-"
                )}
              </p>

              <p>
                <b>Postcode:</b>
                ${escapeHtml(
                  application.postcode || "-"
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
                ${application.licence_points ?? "-"}
              </p>

              <p>
                <b>Accidents Last 5 Years:</b>
                ${escapeHtml(
                  application.accidents_last_5_years ||
                  "-"
                )}
              </p>

              <p>
                <b>Documents:</b>
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

            </div>
          `;

        }
      )
      .join("");
}


// ======================================================
// END PART 3 OF 4
// ======================================================
// ======================================================
// CAR 4 U 1 LTD - FLEET MANAGER V8
// PART 3 OF 4
// DRIVERS + DRIVER APPLICATIONS + ASSIGNMENT
// ======================================================


// ======================================================
// RENDER DRIVERS
// ======================================================

function renderDrivers() {

  const container =
    $("driverList");

  if (!container) {
    return;
  }

  const approvedDrivers =
    driverApplications.filter(
      application =>
        application.status ===
        "approved"
    );

  const legacyDrivers =
    fleet.filter(
      car =>
        car.driver_name
    );

  if (
    !approvedDrivers.length &&
    !legacyDrivers.length
  ) {

    container.innerHTML =
      `
        <div class="card">
          No approved drivers yet.
        </div>
      `;

    return;
  }

  let html = "";

  approvedDrivers.forEach(
    driver => {

      let assignedCar = null;

      if (
        driver.assigned_vehicle_id
      ) {

        assignedCar =
          fleet.find(
            car =>
              car.id ===
              driver.assigned_vehicle_id
          ) || null;

      }

      if (!assignedCar) {

        const driverPhone =
          String(
            driver.phone || ""
          )
            .replace(
              /[^0-9]/g,
              ""
            );

        assignedCar =
          fleet.find(
            car => {

              const carPhone =
                String(
                  car.driver_phone || ""
                )
                  .replace(
                    /[^0-9]/g,
                    ""
                  );

              const samePhone =
                driverPhone &&
                carPhone &&
                driverPhone ===
                carPhone;

              const sameName =
                driver.full_name &&
                car.driver_name &&
                driver.full_name
                  .trim()
                  .toLowerCase() ===
                car.driver_name
                  .trim()
                  .toLowerCase();

              return (
                samePhone ||
                sameName
              );

            }
          ) || null;

      }

      const docs =
        driverApplicationDocuments[
          driver.id
        ] || [];

      html += `

        <div class="vehicle-card">

          <div class="row">

            <div>

              <h3>
                ${escapeHtml(
                  driver.full_name ||
                  "Approved Driver"
                )}
              </h3>

              <p class="small">
                Approved Driver
              </p>

            </div>

            <span class="badge greenText">
              Approved
            </span>

          </div>

          <hr>

          <p>
            <b>Phone:</b>
            ${escapeHtml(
              driver.phone || "-"
            )}
          </p>

          <p>
            <b>Email:</b>
            ${escapeHtml(
              driver.email || "-"
            )}
          </p>

          <p>
            <b>Postcode:</b>
            ${escapeHtml(
              driver.postcode || "-"
            )}
          </p>

          <p>
            <b>Driving Licence:</b>
            ${escapeHtml(
              driver.driving_licence_number ||
              "-"
            )}
          </p>

          <p>
            <b>Licence Expiry:</b>
            ${escapeHtml(
              formatDate(
                driver.driving_licence_expiry
              )
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
            ${escapeHtml(
              formatDate(
                driver.taxi_badge_expiry
              )
            )}
          </p>

          <p>
            <b>Licence Points:</b>
            ${driver.licence_points ?? "-"}
          </p>

          <p>
            <b>Accidents Last 5 Years:</b>
            ${escapeHtml(
              driver.accidents_last_5_years ||
              "-"
            )}
          </p>

          <p>
            <b>Uploaded Documents:</b>
            ${docs.length}
          </p>

          <p>
            <b>Vehicle:</b>
            ${
              assignedCar
                ? escapeHtml(
                    assignedCar.registration
                  )
                : "Not assigned"
            }
          </p>

          <button
            class="blue"
            onclick="viewDriverApplication('${driver.id}')"
          >
            View Driver Profile & Documents
          </button>

          <button
            class="green"
            onclick="assignApprovedDriverToVehicle('${driver.id}')"
          >
            Assign to Vehicle
          </button>

          <button
            onclick="whatsappApplicationDriver('${driver.id}')"
          >
            WhatsApp Driver
          </button>

          <button
            class="danger"
            onclick="deleteApprovedDriver('${driver.id}')"
          >
            🗑 Delete Driver
          </button>

        </div>
      `;

    }
  );


  legacyDrivers.forEach(
    car => {

      const alreadyShown =
        approvedDrivers.some(
          driver => {

            if (
              driver.assigned_vehicle_id &&
              driver.assigned_vehicle_id ===
              car.id
            ) {
              return true;
            }

            const appPhone =
              String(
                driver.phone || ""
              )
                .replace(
                  /[^0-9]/g,
                  ""
                );

            const carPhone =
              String(
                car.driver_phone || ""
              )
                .replace(
                  /[^0-9]/g,
                  ""
                );

            const samePhone =
              appPhone &&
              carPhone &&
              appPhone ===
              carPhone;

            const sameName =
              driver.full_name &&
              car.driver_name &&
              driver.full_name
                .trim()
                .toLowerCase() ===
              car.driver_name
                .trim()
                .toLowerCase();

            return (
              samePhone ||
              sameName
            );

          }
        );

      if (alreadyShown) {
        return;
      }

      html += `

        <div class="card">

          <h3>
            ${escapeHtml(
              car.driver_name
            )}
          </h3>

          <p>
            Vehicle:
            <b>
              ${escapeHtml(
                car.registration || ""
              )}
            </b>
          </p>

          <p>
            ${escapeHtml(
              car.driver_phone || ""
            )}
          </p>

          <button
            class="blue"
            onclick="sendWhatsApp('${car.id}')"
          >
            WhatsApp Driver
          </button>

        </div>
      `;

    }
  );

  container.innerHTML = html;
}


// ======================================================
// ASSIGN DRIVER TO VEHICLE
// ======================================================

function assignApprovedDriverToVehicle(
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

  if (!fleet.length) {

    alert(
      "There are no vehicles in your fleet."
    );

    return;
  }

  let vehicleList =
    "Choose a vehicle:\n\n";

  fleet.forEach(
    (car, index) => {

      vehicleList +=
        `${index + 1}. ${car.registration || ""} - ${car.make_model || ""}`;

      if (car.driver_name) {

        vehicleList +=
          ` (Current driver: ${car.driver_name})`;

      }

      vehicleList += "\n";

    }
  );

  const choice =
    prompt(
      vehicleList
    );

  if (!choice) {
    return;
  }

  const vehicleIndex =
    Number(choice) - 1;

  if (
    !Number.isInteger(
      vehicleIndex
    ) ||
    vehicleIndex < 0 ||
    vehicleIndex >=
      fleet.length
  ) {

    alert(
      "Please enter a valid vehicle number."
    );

    return;
  }

  const vehicle =
    fleet[
      vehicleIndex
    ];

  confirmDriverVehicleAssignment(
    driver,
    vehicle
  );
}


// ======================================================
// CONFIRM VEHICLE ASSIGNMENT
// ======================================================

async function confirmDriverVehicleAssignment(
  driver,
  vehicle
) {

  let message =
    `Assign ${driver.full_name || "this driver"} to ` +
    `${vehicle.registration || "this vehicle"}?`;

  if (
    vehicle.driver_name &&
    String(
      vehicle.driver_name
    )
      .trim()
      .toLowerCase() !==
    String(
      driver.full_name || ""
    )
      .trim()
      .toLowerCase()
  ) {

    message +=
      `\n\nWARNING: ${vehicle.registration} is currently assigned to ` +
      `${vehicle.driver_name}. This will replace that driver.`;

  }

  if (
    !confirm(
      message
    )
  ) {
    return;
  }

  try {

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
            driver.full_name || "",

          driver_phone:
            driver.phone || "",

          licence_expiry:
            driver.driving_licence_expiry ||
            null,

          badge_expiry:
            driver.taxi_badge_expiry ||
            null,

          status:
            "Rented"

        })
        .eq(
          "id",
          vehicle.id
        );

    if (vehicleError) {
      throw vehicleError;
    }

    const {
      error:
        driverError
    } =
      await sb
        .from(
          "driver_applications"
        )
        .update({

          assigned_vehicle_id:
            vehicle.id,

          updated_at:
            new Date()
              .toISOString()

        })
        .eq(
          "id",
          driver.id
        );

    if (driverError) {
      throw driverError;
    }

    lastAssignedVehicleId =
      vehicle.id;

    lastAssignedDriverApplicationId =
      driver.id;

    await loadVehicles();

    await loadDriverApplications(
      false,
      true
    );

    render();

    showVehicleDocumentSendBox(
      driver,
      vehicle
    );

  } catch (error) {

    console.error(error);

    alert(
      "Could not assign driver to vehicle: " +
      error.message
    );

  }
}


// ======================================================
// DRIVER APPLICATION UI
// ======================================================

function ensureDriverApplicationsUI() {

  const nav =
    document.querySelector(
      "nav.tabs"
    );

  if (
    nav &&
    !$(
      "driverApplicationsNavButton"
    )
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
    !$(
      "driverApplications"
    )
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
              Review applications,
              documents and approvals.
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
    !$(
      "driverApplicationDetail"
    )
  ) {

    const section =
      document.createElement(
        "section"
      );

    section.id =
      "driverApplicationDetail";

    section.className =
      "tab hidden";

    section.innerHTML = `

      <div class="panel">

        <button
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
      section
    );
  }
}


// ======================================================
// LOAD DRIVER APPLICATIONS
// ======================================================

async function loadDriverApplications(
  showMessage = false,
  quiet = false
) {

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
            ascending: false
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

    if (showMessage) {

      alert(
        "Driver applications refreshed."
      );

    }

  } catch (error) {

    console.error(
      "Driver applications error:",
      error
    );

    if (!quiet) {

      const list =
        $("driverApplicationList");

      if (list) {

        list.innerHTML =
          `
            <div class="card red">
              ${escapeHtml(
                error.message
              )}
            </div>
          `;

      }

    }

  }
}


// ======================================================
// LOAD DRIVER APPLICATION DOCUMENTS
// ======================================================

async function loadDriverApplicationDocuments() {

  driverApplicationDocuments = {};

  if (
    !driverApplications.length
  ) {
    return;
  }

  const ids =
    driverApplications.map(
      item =>
        item.id
    );

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

  if (error) {

    console.error(error);

    return;
  }

  (data || []).forEach(
    document => {

      if (
        !driverApplicationDocuments[
          document.application_id
        ]
      ) {

        driverApplicationDocuments[
          document.application_id
        ] = [];

      }

      driverApplicationDocuments[
        document.application_id
      ].push(
        document
      );

    }
  );
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
// RENDER DRIVER APPLICATIONS
// ======================================================

function renderDriverApplications() {

  const container =
    $("driverApplicationList");

  if (!container) {
    return;
  }

  const search =
    (
      $("driverApplicationSearch")
        ?.value || ""
    )
      .trim()
      .toLowerCase();

  const filter =
    (
      $("driverApplicationStatusFilter")
        ?.value || ""
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

        const matchesFilter =
          !filter ||
          String(
            application.status || ""
          ).toLowerCase() ===
          filter;

        return (
          matchesSearch &&
          matchesFilter
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

    $("driverApplicationStats").innerHTML =
      `
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

  if (!filtered.length) {

    container.innerHTML =
      `
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
                      "Driver Invitation"
                    )}
                  </h3>

                  <p class="small">
                    ${escapeHtml(
                      application.email || ""
                    )}
                  </p>

                </div>

                <span class="badge">
                  ${escapeHtml(
                    application.status ||
                    "invited"
                  )}
                </span>

              </div>

              <hr>

              <p>
                <b>Phone:</b>
                ${escapeHtml(
                  application.phone || "-"
                )}
              </p>

              <p>
                <b>Postcode:</b>
                ${escapeHtml(
                  application.postcode || "-"
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
                ${application.licence_points ?? "-"}
              </p>

              <p>
                <b>Accidents Last 5 Years:</b>
                ${escapeHtml(
                  application.accidents_last_5_years ||
                  "-"
                )}
              </p>

              <p>
                <b>Documents:</b>
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

            </div>
          `;

        }
      )
      .join("");
}


// ======================================================
// END PART 3 OF 4
// ======================================================
