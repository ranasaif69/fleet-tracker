// ======================================================
// CAR 4 U 1 LTD - FLEET MANAGER V8
// CLOUD VERSION - SUPABASE
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

let currentUser = null;
let currentProfile = null;

let fleet = [];
let expenses = {};
let documents = {};

let editVehicleId = null;
let expenseVehicleId = null;

const $ =
  id =>
    document.getElementById(id);


// ======================================================
// START APP
// ======================================================

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    addCreateAccountButton();

    await checkSession();

  }
);


// ======================================================
// CREATE ACCOUNT BUTTON
// ======================================================

function addCreateAccountButton(){

  const loginButton =
    document.querySelector(
      "#loginScreen button"
    );

  if(!loginButton){
    return;
  }

  if(
    document.getElementById(
      "createAccountBtn"
    )
  ){
    return;
  }

  const signupButton =
    document.createElement(
      "button"
    );

  signupButton.id =
    "createAccountBtn";

  signupButton.innerText =
    "Create Admin Account";

  signupButton.className =
    "secondary";

  signupButton.onclick =
    createAccount;

  loginButton.insertAdjacentElement(
    "afterend",
    signupButton
  );
}


// ======================================================
// CHECK EXISTING LOGIN
// ======================================================

async function checkSession(){

  try{

    const {
      data,
      error
    } =
      await sb.auth.getSession();

    if(error){
      throw error;
    }

    const session =
      data.session;

    if(!session){

      showLogin();

      return;
    }

    currentUser =
      session.user;

    await loadProfile();

    showApp();

    await refreshAll();

    showTab(
      "dashboard"
    );

  } catch(error){

    console.error(
      error
    );

    showLogin();

    if(
      $("loginMessage")
    ){

      $("loginMessage").innerText =
        error.message;

    }
  }
}


// ======================================================
// LOGIN
// ======================================================

async function login(){

  const email =
    $("loginEmail")
      .value
      .trim();

  const password =
    $("loginPassword")
      .value;

  if(
    !email ||
    !password
  ){

    $("loginMessage").innerText =
      "Please enter your email and password.";

    return;
  }

  $("loginMessage").innerText =
    "Signing in...";

  try{

    const {
      data,
      error
    } =
      await sb.auth
        .signInWithPassword({

          email: email,

          password: password

        });

    if(error){
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

  } catch(error){

    console.error(
      error
    );

    $("loginMessage").innerText =
      error.message;

  }
}


// ======================================================
// CREATE ADMIN ACCOUNT
// ======================================================

async function createAccount(){

  const email =
    $("loginEmail")
      .value
      .trim();

  const password =
    $("loginPassword")
      .value;

  if(!email){

    alert(
      "Enter your email address first."
    );

    return;
  }

  if(
    !password ||
    password.length < 6
  ){

    alert(
      "Choose a password with at least 6 characters."
    );

    return;
  }

  const ok =
    confirm(
      "Create this as your Car 4 U 1 Fleet Manager account?"
    );

  if(!ok){
    return;
  }

  $("loginMessage").innerText =
    "Creating account...";

  try{

    const {
      data,
      error
    } =
      await sb.auth.signUp({

        email: email,

        password: password,

        options: {

          data: {
            name:
              OWNER_NAME
          }

        }

      });

    if(error){
      throw error;
    }

    if(data.session){

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
      "Account created. Check your email for the confirmation message, confirm it, then return here and log in.";

  } catch(error){

    console.error(
      error
    );

    $("loginMessage").innerText =
      error.message;

  }
}


// ======================================================
// SHOW LOGIN / APP
// ======================================================

function showLogin(){

  if(
    $("loginScreen")
  ){

    $("loginScreen")
      .classList
      .remove(
        "hidden"
      );

  }

  if(
    $("app")
  ){

    $("app")
      .classList
      .add(
        "hidden"
      );

  }
}


function showApp(){

  if(
    $("loginScreen")
  ){

    $("loginScreen")
      .classList
      .add(
        "hidden"
      );

  }

  if(
    $("app")
  ){

    $("app")
      .classList
      .remove(
        "hidden"
      );

  }
}


// ======================================================
// LOGOUT
// ======================================================

async function logout(){

  await sb.auth
    .signOut();

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

  showLogin();

}


// ======================================================
// LOAD PROFILE
// ======================================================

async function loadProfile(){

  if(
    !currentUser
  ){
    return;
  }

  for(
    let attempt = 0;
    attempt < 6;
    attempt++
  ){

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

    if(error){

      console.error(
        error
      );

    }

    if(data){

      currentProfile =
        data;

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

  throw new Error(
    "Your Fleet Manager profile could not be loaded."
  );
}


// ======================================================
// TABS
// ======================================================

function showTab(name){

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

  if(selected){

    selected
      .classList
      .remove(
        "hidden"
      );

  }

  if(
    name ===
    "reports"
  ){

    report();

  }
}


// ======================================================
// REFRESH CLOUD DATA
// ======================================================

async function refreshAll(){

  if(
    !currentUser
  ){
    return;
  }

  try{

    await loadVehicles();

    await loadExpenses();

    await loadDocuments();

    render();

  } catch(error){

    console.error(
      error
    );

    alert(
      "Could not refresh cloud data: " +
      error.message
    );

  }
}


// ======================================================
// LOAD VEHICLES
// ======================================================

async function loadVehicles(){

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

  if(error){

    throw error;

  }

  fleet =
    data || [];

}


// ======================================================
// NEW VEHICLE
// ======================================================

function newCar(){

  editVehicleId =
    null;

  if(
    $("vehicleFormTitle")
  ){

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

      if($(id)){

        $(id).value =
          "";

      }

    }
  );

  if(
    $("status")
  ){

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

async function saveVehicle(){

  if(
    !currentUser
  ){

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

  if(
    !registration
  ){

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

  try{

    let result;

    if(
      editVehicleId
    ){

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

    if(
      result.error
    ){

      throw result.error;

    }

    editVehicleId =
      null;

    await refreshAll();

    showTab(
      "vehicles"
    );

    alert(
      "Vehicle saved to cloud."
    );

  } catch(error){

    console.error(
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

function editVehicle(id){

  const car =
    fleet.find(
      vehicle =>
        vehicle.id === id
    );

  if(
    !car
  ){
    return;
  }

  editVehicleId =
    id;

  $("vehicleFormTitle").innerText =
    "Edit Vehicle";

  $("plate").value =
    car.registration ||
    "";

  $("model").value =
    car.make_model ||
    "";

  $("year").value =
    car.year ||
    "";

  $("mileage").value =
    car.mileage ||
    "";

  $("driver").value =
    car.driver_name ||
    "";

  $("phone").value =
    car.driver_phone ||
    "";

  $("rent").value =
    car.weekly_rent ||
    "";

  $("deposit").value =
    car.deposit ||
    "";

  $("balance").value =
    car.outstanding ||
    "";

  $("mot").value =
    car.mot_expiry ||
    "";

  $("tax").value =
    car.tax_expiry ||
    "";

  $("insurance").value =
    car.insurance_expiry ||
    "";

  $("inspection").value =
    car.inspection_expiry ||
    "";

  $("service").value =
    car.service_due ||
    "";

  $("licence").value =
    car.licence_expiry ||
    "";

  $("badge").value =
    car.badge_expiry ||
    "";

  $("status").value =
    car.status ||
    "Rented";

  $("notes").value =
    car.notes ||
    "";

  showTab(
    "addVehicle"
  );

}


// ======================================================
// DELETE VEHICLE
// ======================================================

async function deleteVehicle(id){

  if(
    !confirm(
      "Delete this vehicle?"
    )
  ){
    return;
  }

  try{

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

    if(error){

      throw error;

    }

    await refreshAll();

  } catch(error){

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
// EXPENSES, DOCUMENTS, RENDERING, ALERTS
// ======================================================


// ======================================================
// LOAD EXPENSES
// ======================================================

async function loadExpenses(){

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

  if(error){
    throw error;
  }

  expenses = {};

  (data || [])
    .forEach(
      item => {

        const vehicleId =
          item.vehicle_id ||
          "general";

        if(
          !expenses[
            vehicleId
          ]
        ){

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

function openExpenses(vehicleId){

  expenseVehicleId =
    vehicleId;

  const car =
    fleet.find(
      item =>
        item.id ===
        vehicleId
    );

  if(
    $("expenseVehicleName")
  ){

    $("expenseVehicleName")
      .innerText =
      car
        ? car.registration
        : "";

  }

  if(
    $("expenseAmount")
  ){

    $("expenseAmount")
      .value =
      "";

  }

  if(
    $("expenseDescription")
  ){

    $("expenseDescription")
      .value =
      "";

  }

  showTab(
    "expensesTab"
  );

  renderExpenses();

}


// ======================================================
// ADD EXPENSE
// ======================================================

async function addExpense(){

  if(
    !expenseVehicleId
  ){

    alert(
      "Select a vehicle first."
    );

    return;
  }

  const amount =
    Number(
      $("expenseAmount")
        ?.value ||
      0
    );

  const description =
    $("expenseDescription")
      ?.value
      .trim() ||
    "";

  if(
    amount <= 0
  ){

    alert(
      "Enter the expense amount."
    );

    return;
  }

  if(
    !description
  ){

    alert(
      "Enter an expense description."
    );

    return;
  }

  try{

    const {
      error
    } =
      await sb
        .from(
          "expenses"
        )
        .insert({

          vehicle_id:
            expenseVehicleId,

          manager_id:
            currentUser.id,

          amount:
            amount,

          description:
            description

        });

    if(error){
      throw error;
    }

    $("expenseAmount")
      .value =
      "";

    $("expenseDescription")
      .value =
      "";

    await loadExpenses();

    renderExpenses();

    render();

  } catch(error){

    console.error(
      error
    );

    alert(
      "Could not add expense: " +
      error.message
    );

  }
}


// ======================================================
// DELETE EXPENSE
// ======================================================

async function deleteExpense(
  expenseId
){

  if(
    !confirm(
      "Delete this expense?"
    )
  ){
    return;
  }

  try{

    const {
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
        );

    if(error){
      throw error;
    }

    await loadExpenses();

    renderExpenses();

    render();

  } catch(error){

    alert(
      "Could not delete expense: " +
      error.message
    );

  }
}


// ======================================================
// RENDER EXPENSES
// ======================================================

function renderExpenses(){

  const container =
    $("expenseList");

  if(
    !container
  ){
    return;
  }

  const list =
    expenses[
      expenseVehicleId
    ] ||
    [];

  if(
    list.length === 0
  ){

    container.innerHTML =
      `<p class="small">
        No expenses recorded.
      </p>`;

    return;
  }

  let total = 0;

  const html =
    list
      .map(
        item => {

          total +=
            Number(
              item.amount ||
              0
            );

          return `
            <div class="card">
              <div class="row">
                <div>
                  <b>
                    £${Number(
                      item.amount ||
                      0
                    ).toFixed(2)}
                  </b>

                  <div class="small">
                    ${escapeHtml(
                      item.description ||
                      ""
                    )}
                  </div>
                </div>

                <button
                  class="danger"
                  style="width:auto"
                  onclick="deleteExpense('${item.id}')"
                >
                  Delete
                </button>
              </div>
            </div>
          `;

        }
      )
      .join("");

  container.innerHTML =
    `
      <div class="card">
        <b>
          Total Expenses:
          £${total.toFixed(2)}
        </b>
      </div>

      ${html}
    `;
}


// ======================================================
// LOAD DOCUMENTS
// ======================================================

async function loadDocuments(){

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

  if(error){

    console.warn(
      "Vehicle documents table:",
      error.message
    );

    documents = {};

    return;
  }

  documents = {};

  (data || [])
    .forEach(
      item => {

        if(
          !documents[
            item.vehicle_id
          ]
        ){

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
// VEHICLE EXPENSE TOTAL
// ======================================================

function vehicleExpenseTotal(
  vehicleId
){

  return (
    expenses[
      vehicleId
    ] ||
    []
  ).reduce(
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
// DATE HELPERS
// ======================================================

function daysUntil(
  dateValue
){

  if(
    !dateValue
  ){
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
      dateValue +
      "T00:00:00"
    );

  if(
    Number.isNaN(
      target.getTime()
    )
  ){
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


function formatDate(
  value
){

  if(
    !value
  ){
    return "Not set";
  }

  const date =
    new Date(
      value +
      "T00:00:00"
    );

  if(
    Number.isNaN(
      date.getTime()
    )
  ){
    return value;
  }

  return date
    .toLocaleDateString(
      "en-GB"
    );
}


// ======================================================
// EXPIRY BADGE
// ======================================================

function expiryBadge(
  label,
  date
){

  if(
    !date
  ){

    return `
      <div>
        <b>${label}:</b>
        <span class="small">
          Not set
        </span>
      </div>
    `;

  }

  const days =
    daysUntil(
      date
    );

  let cls =
    "greenText";

  let text =
    `${formatDate(date)}`;

  if(
    days !== null
  ){

    if(
      days < 0
    ){

      cls =
        "red";

      text +=
        ` — expired`;

    } else if(
      days <= 7
    ){

      cls =
        "red";

      text +=
        ` — ${days} day(s)`;

    } else if(
      days <= 30
    ){

      cls =
        "orange";

      text +=
        ` — ${days} days`;

    }

  }

  return `
    <div>
      <b>${label}:</b>
      <span class="${cls}">
        ${text}
      </span>
    </div>
  `;
}


// ======================================================
// BUILD URGENT ALERTS
// ======================================================

function buildAlerts(){

  const alerts = [];

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

          if(
            days === null
          ){
            return;
          }

          if(
            days <= 30
          ){

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
// RENDER EVERYTHING
// ======================================================

function render(){

  renderDashboard();

  renderVehicles();

  renderDrivers();

}


// ======================================================
// DASHBOARD
// ======================================================

function renderDashboard(){

  const total =
    fleet.length;

  const rented =
    fleet.filter(
      car =>
        String(
          car.status ||
          ""
        )
          .toLowerCase() ===
        "rented"
    ).length;

  const available =
    fleet.filter(
      car =>
        String(
          car.status ||
          ""
        )
          .toLowerCase() ===
        "available"
    ).length;

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

  const alerts =
    buildAlerts();

  if(
    $("statTotal")
  ){
    $("statTotal").innerText =
      total;
  }

  if(
    $("statRented")
  ){
    $("statRented").innerText =
      rented;
  }

  if(
    $("statAvailable")
  ){
    $("statAvailable").innerText =
      available;
  }

  if(
    $("statWeekly")
  ){
    $("statWeekly").innerText =
      "£" +
      weekly.toFixed(2);
  }

  if(
    $("statOutstanding")
  ){
    $("statOutstanding").innerText =
      "£" +
      outstanding.toFixed(2);
  }

  if(
    $("statAlerts")
  ){
    $("statAlerts").innerText =
      alerts.length;
  }


  const container =
    $("urgentAlerts");

  if(
    !container
  ){
    return;
  }

  if(
    alerts.length === 0
  ){

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
        alert => {

          let statusClass =
            "orange";

          let statusText =
            `${alert.days} days`;

          if(
            alert.days < 0
          ){

            statusClass =
              "red";

            statusText =
              "Expired";

          } else if(
            alert.days <= 7
          ){

            statusClass =
              "red";

          }

          return `
            <div class="card">
              <b>
                ${escapeHtml(
                  alert.registration
                )}
              </b>

              <div>
                ${escapeHtml(
                  alert.label
                )}
              </div>

              <div class="${statusClass}">
                ${formatDate(
                  alert.date
                )}
                —
                ${statusText}
              </div>
            </div>
          `;

        }
      )
      .join("");
}


// ======================================================
// RENDER VEHICLES
// ======================================================

function renderVehicles(){

  const container =
    $("vehicleList");

  if(
    !container
  ){
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

  if(
    filtered.length === 0
  ){

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
        car => {

          const expenseTotal =
            vehicleExpenseTotal(
              car.id
            );

          return `
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


              <div>
                <b>Driver:</b>
                ${escapeHtml(
                  car.driver_name ||
                  "No driver"
                )}
              </div>

              <div>
                <b>Phone:</b>
                ${escapeHtml(
                  car.driver_phone ||
                  "-"
                )}
              </div>

              <div>
                <b>Weekly Rent:</b>
                £${Number(
                  car.weekly_rent ||
                  0
                ).toFixed(2)}
              </div>

              <div>
                <b>Outstanding:</b>
                £${Number(
                  car.outstanding ||
                  0
                ).toFixed(2)}
              </div>

              <div>
                <b>Expenses:</b>
                £${expenseTotal.toFixed(2)}
              </div>


              <hr>


              ${expiryBadge(
                "MOT",
                car.mot_expiry
              )}

              ${expiryBadge(
                "Road Tax",
                car.tax_expiry
              )}

              ${expiryBadge(
                "Insurance",
                car.insurance_expiry
              )}

              ${expiryBadge(
                "Taxi Inspection",
                car.inspection_expiry
              )}

              ${expiryBadge(
                "Taxi Licence",
                car.licence_expiry
              )}

              ${expiryBadge(
                "Badge",
                car.badge_expiry
              )}


              <div class="actions">

                <button
                  onclick="editVehicle('${car.id}')"
                >
                  Edit
                </button>

                <button
                  class="secondary"
                  onclick="openExpenses('${car.id}')"
                >
                  Expenses
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
          `;

        }
      )
      .join("");
}


// ======================================================
// DRIVER LIST
// ======================================================

function renderDrivers(){

  const container =
    $("driverList");

  if(
    !container
  ){
    return;
  }

  const drivers =
    fleet.filter(
      car =>
        car.driver_name
    );

  if(
    drivers.length === 0
  ){

    container.innerHTML =
      `
        <div class="card">
          No drivers assigned to vehicles.
        </div>
      `;

    return;
  }

  container.innerHTML =
    drivers
      .map(
        car => `
          <div class="card">

            <h3>
              ${escapeHtml(
                car.driver_name
              )}
            </h3>

            <div>
              Vehicle:
              <b>
                ${escapeHtml(
                  car.registration ||
                  ""
                )}
              </b>
            </div>

            <div>
              ${escapeHtml(
                car.driver_phone ||
                ""
              )}
            </div>

            <button
              class="blue"
              onclick="sendWhatsApp('${car.id}')"
            >
              WhatsApp Driver
            </button>

          </div>
        `
      )
      .join("");
}


// ======================================================
// WHATSAPP DRIVER
// ======================================================

function sendWhatsApp(
  vehicleId
){

  const car =
    fleet.find(
      item =>
        item.id ===
        vehicleId
    );

  if(
    !car
  ){
    return;
  }

  const phone =
    String(
      car.driver_phone ||
      ""
    )
      .replace(
        /[^0-9]/g,
        ""
      );

  if(
    !phone
  ){

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
// REPORT
// ======================================================

function report(){

  const container =
    $("reportOutput");

  if(
    !container
  ){
    return;
  }

  const totalRent =
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

  const totalOutstanding =
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

  const totalExpenses =
    Object.values(
      expenses
    )
      .flat()
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

  container.innerHTML =
    `
      <div class="card">
        <h3>Fleet Report</h3>

        <p>
          Total Vehicles:
          <b>${fleet.length}</b>
        </p>

        <p>
          Weekly Rent:
          <b>
            £${totalRent.toFixed(2)}
          </b>
        </p>

        <p>
          Outstanding:
          <b>
            £${totalOutstanding.toFixed(2)}
          </b>
        </p>

        <p>
          Recorded Expenses:
          <b>
            £${totalExpenses.toFixed(2)}
          </b>
        </p>
      </div>
    `;
}


// ======================================================
// HTML SAFETY
// ======================================================

function escapeHtml(
  value
){

  return String(
    value ??
    ""
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
// END PART 2 OF 4
// ======================================================
// ======================================================
// CAR 4 U 1 LTD - FLEET MANAGER V8
// PART 3 OF 4
// DRIVER APPLICATIONS / ONBOARDING ADMIN
// ======================================================


let driverApplications = [];

let driverApplicationDocuments = {};

let selectedDriverApplicationId = null;


// ======================================================
// ADD DRIVER APPLICATIONS UI AUTOMATICALLY
// ======================================================

function ensureDriverApplicationsUI(){

  // ----------------------------------------------
  // ADD NAVIGATION BUTTON
  // ----------------------------------------------

  const nav =
    document.querySelector(
      "nav.tabs"
    );

  if(
    nav &&
    !document.getElementById(
      "driverApplicationsNavButton"
    )
  ){

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


  // ----------------------------------------------
  // ADD APPLICATIONS SECTION
  // ----------------------------------------------

  const app =
    document.getElementById(
      "app"
    );

  if(
    app &&
    !document.getElementById(
      "driverApplications"
    )
  ){

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
              Review new driver applications,
              documents and approval status.
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
        >
        </div>


        <div
          id="driverApplicationList"
        >
          <p>
            Loading applications...
          </p>
        </div>

      </div>

    `;

    app.appendChild(
      section
    );

  }


  // ----------------------------------------------
  // ADD DETAIL SECTION
  // ----------------------------------------------

  if(
    app &&
    !document.getElementById(
      "driverApplicationDetail"
    )
  ){

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
        >
        </div>

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

async function openDriverApplications(){

  ensureDriverApplicationsUI();

  showTab(
    "driverApplications"
  );

  await loadDriverApplications();

}


// ======================================================
// LOAD APPLICATIONS
// ======================================================

async function loadDriverApplications(
  showMessage = false
){

  ensureDriverApplicationsUI();

  const list =
    $("driverApplicationList");

  if(
    list
  ){

    list.innerHTML =
      `
        <div class="card">
          Loading driver applications...
        </div>
      `;

  }

  try{

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

    if(error){
      throw error;
    }

    driverApplications =
      data ||
      [];

    await loadDriverApplicationDocuments();

    renderDriverApplications();

    if(
      showMessage
    ){

      alert(
        "Driver applications refreshed."
      );

    }

  } catch(error){

    console.error(
      "Driver applications error:",
      error
    );

    if(
      list
    ){

      list.innerHTML =
        `
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
// LOAD DRIVER APPLICATION DOCUMENT RECORDS
// ======================================================

async function loadDriverApplicationDocuments(){

  driverApplicationDocuments =
    {};

  if(
    driverApplications.length === 0
  ){
    return;
  }

  const applicationIds =
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
        applicationIds
      )
      .order(
        "uploaded_at",
        {
          ascending: false
        }
      );

  if(error){

    console.error(
      "Driver application documents:",
      error
    );

    return;

  }

  (data || [])
    .forEach(
      document => {

        if(
          !driverApplicationDocuments[
            document.application_id
          ]
        ){

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
// APPLICATION STATUS HELPERS
// ======================================================

function applicationStatusClass(
  status
){

  switch(
    String(
      status ||
      ""
    ).toLowerCase()
  ){

    case "approved":
      return "greenText";

    case "rejected":
      return "red";

    case "submitted":
      return "orange";

    default:
      return "";

  }

}


function applicationStatusText(
  status
){

  const value =
    String(
      status ||
      "invited"
    );

  return (
    value
      .charAt(0)
      .toUpperCase() +
    value
      .slice(1)
  );

}


// ======================================================
// RENDER DRIVER APPLICATIONS
// ======================================================

function renderDriverApplications(){

  ensureDriverApplicationsUI();

  const container =
    $("driverApplicationList");

  if(
    !container
  ){
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
            .join(
              " "
            )
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
          ).toLowerCase() ===
          statusFilter;


        return (
          matchesSearch &&
          matchesStatus
        );

      }
    );


  // ----------------------------------------------
  // STATS
  // ----------------------------------------------

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


  if(
    $("driverApplicationStats")
  ){

    $("driverApplicationStats").innerHTML =
      `

        <div class="stat">
          <span>
            Submitted
          </span>
          <b>
            ${submitted}
          </b>
        </div>

        <div class="stat">
          <span>
            Approved
          </span>
          <b>
            ${approved}
          </b>
        </div>

        <div class="stat">
          <span>
            Rejected
          </span>
          <b>
            ${rejected}
          </b>
        </div>

        <div class="stat">
          <span>
            Invited
          </span>
          <b>
            ${invited}
          </b>
        </div>

      `;

  }


  // ----------------------------------------------
  // NO RESULTS
  // ----------------------------------------------

  if(
    filtered.length === 0
  ){

    container.innerHTML =
      `
        <div class="card">
          No driver applications found.
        </div>
      `;

    return;

  }


  // ----------------------------------------------
  // APPLICATION CARDS
  // ----------------------------------------------

  container.innerHTML =
    filtered
      .map(
        application => {

          const docs =
            driverApplicationDocuments[
              application.id
            ] ||
            [];


          return `

            <div class="vehicle-card">

              <div class="row">

                <div>

                  <h3>
                    ${
                      escapeHtml(
                        application.full_name ||
                        "New Driver Invitation"
                      )
                    }
                  </h3>

                  <div class="small">
                    ${
                      escapeHtml(
                        application.email ||
                        ""
                      )
                    }
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
                <b>
                  Phone:
                </b>

                ${
                  escapeHtml(
                    application.phone ||
                    "-"
                  )
                }
              </p>


              <p>
                <b>
                  Postcode:
                </b>

                ${
                  escapeHtml(
                    application.postcode ||
                    "-"
                  )
                }
              </p>


              <p>
                <b>
                  Taxi Badge:
                </b>

                ${
                  escapeHtml(
                    application.taxi_badge_number ||
                    "-"
                  )
                }
              </p>


              <p>
                <b>
                  Licence Points:
                </b>

                ${
                  application.licence_points ??
                  "-"
                }
              </p>


              <p>
                <b>
                  Accidents in Last 5 Years:
                </b>

                ${
                  escapeHtml(
                    application.accidents_last_5_years ||
                    "-"
                  )
                }
              </p>


              <p>
                <b>
                  Documents:
                </b>

                ${docs.length}
              </p>


              <p class="small">
                Submitted:
                ${
                  application.submitted_at
                    ? new Date(
                        application.submitted_at
                      )
                        .toLocaleString(
                          "en-GB"
                        )
                    : "Not submitted"
                }
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
// VIEW FULL DRIVER APPLICATION
// ======================================================

function viewDriverApplication(
  applicationId
){

  const application =
    driverApplications.find(
      item =>
        item.id ===
        applicationId
    );


  if(
    !application
  ){

    alert(
      "Driver application could not be found."
    );

    return;

  }


  selectedDriverApplicationId =
    applicationId;


  showTab(
    "driverApplicationDetail"
  );


  const docs =
    driverApplicationDocuments[
      applicationId
    ] ||
    [];


  const box =
    $("driverApplicationDetailBox");


  if(
    !box
  ){
    return;
  }


  box.innerHTML =
    `

      <div class="vehicle-card">

        <div class="row">

          <div>

            <h2>
              ${
                escapeHtml(
                  application.full_name ||
                  "Driver Application"
                )
              }
            </h2>

            <p class="small">
              Application ID:
              ${
                escapeHtml(
                  application.id
                )
              }
            </p>

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
                    No uploaded documents found.
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

          : `
              <div class="${
                applicationStatusClass(
                  application.status
                )
              }">

                Current Status:
                <b>
                  ${
                    applicationStatusText(
                      application.status
                    )
                  }
                </b>

              </div>
            `
        }

      </div>

    `;

}


// ======================================================
// DETAIL ROW
// ======================================================

function detailRow(
  label,
  value
){

  let displayValue =
    value;


  if(
    displayValue === null ||
    displayValue === undefined ||
    displayValue === ""
  ){

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
// DRIVER DOCUMENT CARD
// ======================================================

function driverDocumentCard(
  document
){

  const label =
    driverDocumentLabel(
      document.document_type
    );


  return `

    <div class="doc">

      <b>
        ${escapeHtml(label)}
      </b>

      <p class="small">
        ${
          escapeHtml(
            document.file_name ||
            ""
          )
        }
      </p>

      <button
        class="blue"
        onclick="openDriverDocument('${document.id}')"
      >
        View Document
      </button>

    </div>

  `;

}


// ======================================================
// DOCUMENT LABELS
// ======================================================

function driverDocumentLabel(
  type
){

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
      "Proof of Address"

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
// OPEN PRIVATE DRIVER DOCUMENT
// ======================================================

async function openDriverDocument(
  documentId
){

  const allDocuments =
    Object
      .values(
        driverApplicationDocuments
      )
      .flat();


  const document =
    allDocuments.find(
      item =>
        item.id ===
        documentId
    );


  if(
    !document
  ){

    alert(
      "Document could not be found."
    );

    return;

  }


  try{

    const {
      data,
      error
    } =
      await sb
        .storage
        .from(
          "driver-onboarding"
        )
        .createSignedUrl(
          document.file_path,
          300
        );


    if(error){
      throw error;
    }


    if(
      !data ||
      !data.signedUrl
    ){

      throw new Error(
        "Could not create document link."
      );

    }


    window.open(
      data.signedUrl,
      "_blank"
    );


  } catch(error){

    console.error(
      error
    );


    alert(
      "Could not open document: " +
      error.message
    );

  }

}


// ======================================================
// APPROVE APPLICATION
// ======================================================

async function approveDriverApplication(
  applicationId
){

  const application =
    driverApplications.find(
      item =>
        item.id ===
        applicationId
    );


  if(
    !application
  ){
    return;
  }


  const confirmed =
    confirm(
      "Approve " +
      (
        application.full_name ||
        "this driver"
      ) +
      "?"
    );


  if(
    !confirmed
  ){
    return;
  }


  try{

    const {
      error
    } =
      await sb
        .from(
          "driver_applications"
        )
        .update({

          status:
            "approved",

          updated_at:
            new Date()
              .toISOString()

        })
        .eq(
          "id",
          applicationId
        );


    if(error){
      throw error;
    }


    alert(
      "Driver application approved."
    );


    await loadDriverApplications();


    openDriverApplications();


  } catch(error){

    console.error(
      error
    );


    alert(
      "Could not approve application: " +
      error.message
    );

  }

}


// ======================================================
// REJECT APPLICATION
// ======================================================

async function rejectDriverApplication(
  applicationId
){

  const application =
    driverApplications.find(
      item =>
        item.id ===
        applicationId
    );


  if(
    !application
  ){
    return;
  }


  const confirmed =
    confirm(
      "Reject " +
      (
        application.full_name ||
        "this driver application"
      ) +
      "?"
    );


  if(
    !confirmed
  ){
    return;
  }


  try{

    const {
      error
    } =
      await sb
        .from(
          "driver_applications"
        )
        .update({

          status:
            "rejected",

          updated_at:
            new Date()
              .toISOString()

        })
        .eq(
          "id",
          applicationId
        );


    if(error){
      throw error;
    }


    alert(
      "Driver application rejected."
    );


    await loadDriverApplications();


    openDriverApplications();


  } catch(error){

    console.error(
      error
    );


    alert(
      "Could not reject application: " +
      error.message
    );

  }

}


// ======================================================
// WHATSAPP APPLICATION DRIVER
// ======================================================

function whatsappApplicationDriver(
  applicationId
){

  const application =
    driverApplications.find(
      item =>
        item.id ===
        applicationId
    );


  if(
    !application
  ){
    return;
  }


  const phone =
    String(
      application.phone ||
      ""
    )
      .replace(
        /[^0-9]/g,
        ""
      );


  if(
    !phone
  ){

    alert(
      "No phone number saved."
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

}


// ======================================================
// LOAD DRIVER APPLICATIONS WHEN APP RENDERS
// ======================================================

const baseRender =
  render;


render =
  function(){

    baseRender();

    ensureDriverApplicationsUI();

  };


// ======================================================
// LOAD UI AFTER LOGIN
// ======================================================

setTimeout(
  () => {

    ensureDriverApplicationsUI();

  },
  500
);


// ======================================================
// END PART 3 OF 4
// ======================================================
// ======================================================
// CAR 4 U 1 LTD - FLEET MANAGER V8
// PART 4 OF 4
// DRIVER INVITATIONS + AUTH + FINAL STARTUP
// ======================================================


// ======================================================
// DRIVER ONBOARDING PAGE
// ======================================================

const DRIVER_ONBOARDING_PAGE =
  window.location.origin +
  "/driver-onboarding.html";


// ======================================================
// ADD NEW DRIVER LINK BUTTON
// ======================================================

function addDriverInvitationButton(){

  const section =
    document.getElementById(
      "driverApplications"
    );

  if(
    !section
  ){
    return;
  }


  if(
    document.getElementById(
      "createDriverInvitationButton"
    )
  ){
    return;
  }


  const firstRow =
    section.querySelector(
      ".panel .row"
    );


  if(
    !firstRow
  ){
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


  button.style.width =
    "auto";


  button.innerText =
    "➕ New Driver Link";


  button.onclick =
    createDriverInvitation;


  firstRow.appendChild(
    button
  );

}


// ======================================================
// CREATE DRIVER INVITATION
// ======================================================

async function createDriverInvitation(){

  try{

    const {
      data,
      error
    } =
      await sb.rpc(
        "create_driver_invitation"
      );


    if(error){
      throw error;
    }


    if(
      !data ||
      data.length === 0
    ){

      throw new Error(
        "Supabase did not return an invitation token."
      );

    }


    const invitation =
      data[0];


    const token =
      invitation.application_token;


    if(
      !token
    ){

      throw new Error(
        "Driver invitation token is missing."
      );

    }


    const link =
      DRIVER_ONBOARDING_PAGE +
      "?token=" +
      encodeURIComponent(
        token
      );


    showDriverInvitationLink(
      link
    );


    await loadDriverApplications();


  } catch(error){

    console.error(
      "Driver invitation error:",
      error
    );


    alert(
      "Could not create driver invitation: " +
      error.message
    );

  }

}


// ======================================================
// SHOW DRIVER INVITATION LINK
// ======================================================

function showDriverInvitationLink(
  link
){

  let modal =
    document.getElementById(
      "driverInvitationModal"
    );


  if(
    !modal
  ){

    modal =
      document.createElement(
        "div"
      );


    modal.id =
      "driverInvitationModal";


    modal.style.position =
      "fixed";


    modal.style.left =
      "0";


    modal.style.right =
      "0";


    modal.style.top =
      "0";


    modal.style.bottom =
      "0";


    modal.style.background =
      "rgba(0,0,0,.55)";


    modal.style.zIndex =
      "9999";


    modal.style.padding =
      "20px";


    modal.style.overflowY =
      "auto";


    modal.innerHTML = `

      <div
        style="
          max-width:600px;
          margin:60px auto;
          background:white;
          border-radius:18px;
          padding:20px;
        "
      >

        <h2>
          🚕 New Driver Invitation
        </h2>


        <p>
          Send this private link to the new driver.
        </p>


        <textarea
          id="driverInvitationLinkText"
          readonly
          style="
            width:100%;
            min-height:120px;
          "
        ></textarea>


        <button
          class="green"
          onclick="copyDriverInvitationLink()"
        >
          Copy Driver Link
        </button>


        <button
          class="blue"
          onclick="shareDriverInvitationWhatsApp()"
        >
          Send by WhatsApp
        </button>


        <button
          class="secondary"
          onclick="closeDriverInvitationModal()"
        >
          Close
        </button>

      </div>

    `;


    document.body.appendChild(
      modal
    );

  }


  const input =
    document.getElementById(
      "driverInvitationLinkText"
    );


  if(
    input
  ){

    input.value =
      link;

  }


  modal.style.display =
    "block";

}


// ======================================================
// COPY DRIVER INVITATION LINK
// ======================================================

async function copyDriverInvitationLink(){

  const input =
    document.getElementById(
      "driverInvitationLinkText"
    );


  if(
    !input
  ){
    return;
  }


  const link =
    input.value;


  try{

    if(
      navigator.clipboard &&
      window.isSecureContext
    ){

      await navigator.clipboard.writeText(
        link
      );


      alert(
        "Driver link copied."
      );


      return;

    }

  } catch(error){

    console.warn(
      error
    );

  }


  input.focus();

  input.select();

  input.setSelectionRange(
    0,
    input.value.length
  );


  alert(
    "The driver link is selected. Tap Copy."
  );

}


// ======================================================
// SHARE DRIVER LINK BY WHATSAPP
// ======================================================

function shareDriverInvitationWhatsApp(){

  const input =
    document.getElementById(
      "driverInvitationLinkText"
    );


  if(
    !input ||
    !input.value
  ){
    return;
  }


  const message =
    `Hi,

Please complete your Car 4 U 1 Ltd private hire driver application using the secure link below.

You will need to provide your personal details, licence information, accident history and upload your required documents.

${input.value}

Thank you,
Car 4 U 1 Ltd`;


  window.open(
    "https://wa.me/?text=" +
    encodeURIComponent(
      message
    ),
    "_blank"
  );

}


// ======================================================
// CLOSE INVITATION WINDOW
// ======================================================

function closeDriverInvitationModal(){

  const modal =
    document.getElementById(
      "driverInvitationModal"
    );


  if(
    modal
  ){

    modal.style.display =
      "none";

  }

}


// ======================================================
// ADD INVITATION BUTTON WHEN APPLICATIONS OPEN
// ======================================================

const originalOpenDriverApplications =
  openDriverApplications;


openDriverApplications =
  async function(){

    await originalOpenDriverApplications();

    addDriverInvitationButton();

  };


// ======================================================
// SHOW WHATSAPP BUTTON IN FULL APPLICATION
// ======================================================

function addApplicationContactButton(){

  const box =
    document.getElementById(
      "driverApplicationDetailBox"
    );


  if(
    !box ||
    !selectedDriverApplicationId
  ){
    return;
  }


  if(
    document.getElementById(
      "applicationWhatsAppButton"
    )
  ){
    return;
  }


  const button =
    document.createElement(
      "button"
    );


  button.id =
    "applicationWhatsAppButton";


  button.className =
    "blue";


  button.innerText =
    "WhatsApp Driver";


  button.onclick =
    function(){

      whatsappApplicationDriver(
        selectedDriverApplicationId
      );

    };


  box.prepend(
    button
  );

}


// ======================================================
// EXTEND VIEW APPLICATION
// ======================================================

const originalViewDriverApplication =
  viewDriverApplication;


viewDriverApplication =
  function(
    applicationId
  ){

    originalViewDriverApplication(
      applicationId
    );


    setTimeout(
      addApplicationContactButton,
      50
    );

  };


// ======================================================
// DRIVER APPLICATION COUNT BADGE
// ======================================================

function updateDriverApplicationsNavCount(){

  const button =
    document.getElementById(
      "driverApplicationsNavButton"
    );


  if(
    !button
  ){
    return;
  }


  const waiting =
    driverApplications.filter(
      application =>
        application.status ===
        "submitted"
    ).length;


  if(
    waiting > 0
  ){

    button.innerText =
      `Driver Applications (${waiting})`;

  } else {

    button.innerText =
      "Driver Applications";

  }

}


// ======================================================
// EXTEND DRIVER APPLICATION RENDER
// ======================================================

const originalRenderDriverApplications =
  renderDriverApplications;


renderDriverApplications =
  function(){

    originalRenderDriverApplications();

    updateDriverApplicationsNavCount();

    addDriverInvitationButton();

  };


// ======================================================
// AUTH STATE
// ======================================================

sb.auth.onAuthStateChange(

  async (
    event,
    session
  ) => {

    if(
      event ===
      "SIGNED_OUT"
    ){

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


      showLogin();

      return;

    }


    if(
      session &&
      session.user
    ){

      currentUser =
        session.user;

    }

  }

);


// ======================================================
// FINAL STARTUP
// ======================================================

window.addEventListener(

  "load",

  function(){

    ensureDriverApplicationsUI();

    addDriverInvitationButton();

  }

);


// ======================================================
// END OF CAR 4 U 1 LTD
// FLEET MANAGER V8
// ======================================================
