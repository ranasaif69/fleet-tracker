// ======================================================
// CAR 4 U 1 LTD - FLEET MANAGER V8
// CLOUD VERSION - SUPABASE
// PART 1 OF 3
// ======================================================

const SUPABASE_URL = "https://ugsxnraeivhluhpzuful.supabase.co";
const SUPABASE_KEY = "YOUR_PUBLISHABLE_KEY";
const OWNER_PHONE = "447426053788";
const OWNER_NAME = "Sufyan";

const sb = supabase.createClient(
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

const $ = id => document.getElementById(id);


// ======================================================
// START APP
// ======================================================

document.addEventListener("DOMContentLoaded", async () => {

  addCreateAccountButton();

  await checkSession();

});


// ======================================================
// CREATE ACCOUNT BUTTON
// ======================================================

function addCreateAccountButton(){

  const loginButton =
    document.querySelector("#loginScreen button");

  if(!loginButton){
    return;
  }

  if(document.getElementById("createAccountBtn")){
    return;
  }

  const signupButton =
    document.createElement("button");

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
    } = await sb.auth.getSession();

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

    showTab("dashboard");

  } catch(error){

    console.error(error);

    showLogin();

    if($("loginMessage")){

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
    $("loginEmail").value.trim();

  const password =
    $("loginPassword").value;

  if(!email || !password){

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
    } = await sb.auth.signInWithPassword({

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

    showTab("dashboard");

    $("loginMessage").innerText =
      "";

  } catch(error){

    console.error(error);

    $("loginMessage").innerText =
      error.message;

  }
}


// ======================================================
// CREATE ADMIN ACCOUNT
// ======================================================

async function createAccount(){

  const email =
    $("loginEmail").value.trim();

  const password =
    $("loginPassword").value;

  if(!email){

    alert(
      "Enter your email address first."
    );

    return;
  }

  if(!password || password.length < 6){

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
    } = await sb.auth.signUp({

      email: email,

      password: password,

      options: {

        data: {
          name: OWNER_NAME
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

      showTab("dashboard");

      return;
    }

    $("loginMessage").innerText =
      "Account created. Check your email for the confirmation message, confirm it, then return here and log in.";

  } catch(error){

    console.error(error);

    $("loginMessage").innerText =
      error.message;

  }
}


// ======================================================
// SHOW LOGIN / APP
// ======================================================

function showLogin(){

  if($("loginScreen")){

    $("loginScreen")
      .classList
      .remove("hidden");

  }

  if($("app")){

    $("app")
      .classList
      .add("hidden");

  }
}


function showApp(){

  if($("loginScreen")){

    $("loginScreen")
      .classList
      .add("hidden");

  }

  if($("app")){

    $("app")
      .classList
      .remove("hidden");

  }
}


// ======================================================
// LOGOUT
// ======================================================

async function logout(){

  await sb.auth.signOut();

  currentUser = null;

  currentProfile = null;

  fleet = [];

  expenses = {};

  documents = {};

  showLogin();

}


// ======================================================
// LOAD PROFILE
// ======================================================

async function loadProfile(){

  if(!currentUser){
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
    } = await sb
      .from("profiles")
      .select("*")
      .eq(
        "id",
        currentUser.id
      )
      .maybeSingle();

    if(error){

      console.error(error);

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
    .querySelectorAll(".tab")
    .forEach(tab => {

      tab.classList.add("hidden");

    });

  const selected =
    $(name);

  if(selected){

    selected
      .classList
      .remove("hidden");

  }

  if(name === "reports"){

    report();

  }
}


// ======================================================
// REFRESH CLOUD DATA
// ======================================================

async function refreshAll(){

  if(!currentUser){
    return;
  }

  try{

    await loadVehicles();

    await loadExpenses();

    await loadDocuments();

    render();

  } catch(error){

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

async function loadVehicles(){

  const {
    data,
    error
  } = await sb
    .from("vehicles")
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

  if($("vehicleFormTitle")){

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

  fields.forEach(id => {

    if($(id)){

      $(id).value =
        "";

    }

  });

  if($("status")){

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

  if(!currentUser){

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

  if(!registration){

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
      $("year").value.trim() ||
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

    if(editVehicleId){

      result =
        await sb
          .from("vehicles")
          .update(car)
          .eq(
            "id",
            editVehicleId
          );

    } else {

      result =
        await sb
          .from("vehicles")
          .insert(car);

    }

    if(result.error){

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

function editVehicle(id){

  const car =
    fleet.find(
      vehicle =>
        vehicle.id === id
    );

  if(!car){
    return;
  }

  editVehicleId =
    id;

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
    } = await sb
      .from("vehicles")
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
// END PART 1
// PASTE PART 2 DIRECTLY BELOW THIS LINE
// ======================================================// ======================================================
// PART 2 OF 3
// EXPENSES + DOCUMENTS
// ======================================================


// ======================================================
// LOAD EXPENSES
// ======================================================

async function loadExpenses(){

  expenses = {};

  if(!fleet.length){
    return;
  }

  const vehicleIds =
    fleet.map(
      vehicle =>
        vehicle.id
    );

  const {
    data,
    error
  } = await sb
    .from("expenses")
    .select("*")
    .in(
      "vehicle_id",
      vehicleIds
    )
    .order(
      "expense_date",
      {
        ascending: false
      }
    );

  if(error){
    throw error;
  }

  (data || []).forEach(expense => {

    if(!expenses[expense.vehicle_id]){

      expenses[expense.vehicle_id] =
        [];

    }

    expenses[expense.vehicle_id]
      .push(expense);

  });
}


// ======================================================
// OPEN ADD EXPENSE
// ======================================================

function addExpense(vehicleId){

  expenseVehicleId =
    vehicleId;

  if($("expenseVehicleId")){

    $("expenseVehicleId").value =
      vehicleId;

  }

  $("expenseDesc").value =
    "";

  $("expenseAmount").value =
    "";

  $("expenseGarage").value =
    "";

  $("expenseDate").value =
    new Date()
      .toISOString()
      .split("T")[0];

  $("expensePaidBy").value =
    "Cash";

  $("expenseReceipt").value =
    "";

  showTab(
    "expenseForm"
  );

}


// ======================================================
// SAVE EXPENSE
// ======================================================

async function saveExpense(){

  if(!expenseVehicleId){

    alert(
      "No vehicle selected."
    );

    return;

  }

  const description =
    $("expenseDesc")
      .value
      .trim();

  const amount =
    Number(
      $("expenseAmount").value
    );

  if(!description){

    alert(
      "Please enter an expense description."
    );

    return;

  }

  if(
    !amount ||
    amount <= 0
  ){

    alert(
      "Please enter a valid expense amount."
    );

    return;

  }

  let receiptPath =
    null;

  const receiptFile =
    $("expenseReceipt")
      .files[0];

  try{

    if(receiptFile){

      receiptPath =
        await uploadFile(
          receiptFile,
          "receipts"
        );

    }

    const {
      error
    } = await sb
      .from("expenses")
      .insert({

        vehicle_id:
          expenseVehicleId,

        description:
          description,

        garage:
          $("expenseGarage")
            .value
            .trim(),

        amount:
          amount,

        paid_by:
          $("expensePaidBy")
            .value,

        expense_date:
          $("expenseDate")
            .value ||
          null,

        receipt_path:
          receiptPath

      });

    if(error){

      throw error;

    }

    await refreshAll();

    showTab(
      "vehicles"
    );

    alert(
      "Expense saved."
    );

  } catch(error){

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

async function deleteExpense(id){

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
    } = await sb
      .from("expenses")
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
      "Could not delete expense: " +
      error.message
    );

  }
}


// ======================================================
// LOAD DOCUMENTS
// ======================================================

async function loadDocuments(){

  documents = {};

  if(!fleet.length){
    return;
  }

  const vehicleIds =
    fleet.map(
      vehicle =>
        vehicle.id
    );

  const {
    data,
    error
  } = await sb
    .from("documents")
    .select("*")
    .in(
      "vehicle_id",
      vehicleIds
    )
    .order(
      "created_at",
      {
        ascending: false
      }
    );

  if(error){

    throw error;

  }

  (data || []).forEach(doc => {

    if(!documents[doc.vehicle_id]){

      documents[doc.vehicle_id] =
        [];

    }

    documents[doc.vehicle_id]
      .push(doc);

  });
}


// ======================================================
// UPLOAD FILE
// ======================================================

async function uploadFile(
  file,
  folder
){

  if(!currentUser){

    throw new Error(
      "Please login first."
    );

  }

  const extension =
    file.name.includes(".")
    ? file.name.split(".").pop()
    : "file";

  const uniqueName =
    Date.now() +
    "-" +
    Math.random()
      .toString(36)
      .slice(2);

  const path =
    currentUser.id +
    "/" +
    folder +
    "/" +
    uniqueName +
    "." +
    extension;

  const {
    error
  } = await sb
    .storage
    .from("fleet-files")
    .upload(
      path,
      file,
      {
        upsert: false
      }
    );

  if(error){

    throw error;

  }

  return path;
}


// ======================================================
// UPLOAD VEHICLE DOCUMENT
// ======================================================

async function uploadDocument(
  vehicleId,
  type,
  input
){

  const file =
    input.files[0];

  if(!file){
    return;
  }

  try{

    const path =
      await uploadFile(
        file,
        "documents"
      );

    const {
      error
    } = await sb
      .from("documents")
      .insert({

        vehicle_id:
          vehicleId,

        document_type:
          type,

        file_name:
          file.name,

        file_path:
          path

      });

    if(error){

      throw error;

    }

    await refreshAll();

    alert(
      "Document uploaded."
    );

  } catch(error){

    console.error(error);

    alert(
      "Document upload failed: " +
      error.message
    );

  }
}


// ======================================================
// OPEN PRIVATE FILE
// ======================================================

async function openPrivateFile(path){

  try{

    const {
      data,
      error
    } = await sb
      .storage
      .from("fleet-files")
      .createSignedUrl(
        path,
        300
      );

    if(error){

      throw error;

    }

    window.open(
      data.signedUrl,
      "_blank"
    );

  } catch(error){

    alert(
      "Could not open file: " +
      error.message
    );

  }
}


// ======================================================
// DELETE DOCUMENT
// ======================================================

async function deleteDocument(id){

  if(
    !confirm(
      "Delete this document?"
    )
  ){

    return;

  }

  const allDocs =
    Object
      .values(documents)
      .flat();

  const doc =
    allDocs.find(
      item =>
        item.id === id
    );

  try{

    if(
      doc &&
      doc.file_path
    ){

      await sb
        .storage
        .from("fleet-files")
        .remove([
          doc.file_path
        ]);

    }

    const {
      error
    } = await sb
      .from("documents")
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
      "Could not delete document: " +
      error.message
    );

  }
}


// ======================================================
// DOCUMENT UPLOAD BOX
// ======================================================

function documentUploadBox(
  vehicleId,
  type,
  label
){

  return `
    <div class="doc">

      <b>${label}</b>

      <input
        type="file"
        accept="image/*,.pdf"
        onchange="uploadDocument('${vehicleId}','${type}',this)"
      >

    </div>
  `;
}


// ======================================================
// DOCUMENT LIST
// ======================================================

function documentList(vehicleId){

  const docs =
    documents[vehicleId] || [];

  if(!docs.length){

    return `
      <p class="small">
        No documents uploaded.
      </p>
    `;

  }

  return docs
    .map(doc => `

      <div class="doc">

        <b>
          ${
            (
              doc.document_type ||
              ""
            )
            .replaceAll(
              "_",
              " "
            )
          }
        </b>

        <br>

        ${
          doc.file_name ||
          ""
        }

        <br>

        <button
          onclick="openPrivateFile('${doc.file_path}')">
          View
        </button>

        <button
          class="danger"
          onclick="deleteDocument('${doc.id}')">
          Delete
        </button>

      </div>

    `)
    .join("");
}


// ======================================================
// DATE HELPERS
// ======================================================

function days(date){

  if(!date){
    return "";
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
      date +
      "T00:00:00"
    );

  return Math.ceil(
    (
      target -
      today
    )
    /
    86400000
  );
}


function dateText(date){

  const left =
    days(date);

  if(left === ""){

    return "No date";

  }

  if(left < 0){

    return "Expired";

  }

  if(left === 0){

    return "Today";

  }

  return (
    left +
    " days"
  );
}


function statusClass(
  date,
  limit
){

  const left =
    days(date);

  if(left === ""){

    return "";

  }

  if(
    left < 0 ||
    left <= 7
  ){

    return "red";

  }

  if(
    left <= limit
  ){

    return "orange";

  }

  return "greenText";
}


function money(value){

  return (
    "£" +
    Number(
      value ||
      0
    ).toFixed(2)
  );
}


// ======================================================
// BUILD ALERTS
// ======================================================

function buildAlerts(){

  const alerts = [];

  const checks = [

    [
      "MOT",
      "mot_expiry",
      30
    ],

    [
      "Road Tax",
      "tax_expiry",
      14
    ],

    [
      "Insurance",
      "insurance_expiry",
      30
    ],

    [
      "Taxi Inspection",
      "inspection_expiry",
      30
    ],

    [
      "Service",
      "service_due",
      30
    ],

    [
      "Driver Licence",
      "licence_expiry",
      30
    ],

    [
      "Taxi Badge",
      "badge_expiry",
      30
    ]

  ];

  fleet.forEach(
    vehicle => {

      checks.forEach(
        (
          [
            label,
            key,
            limit
          ]
        ) => {

          const left =
            days(
              vehicle[key]
            );

          if(
            left !== "" &&
            left <= limit
          ){

            alerts.push(

              (
                vehicle.registration ||
                "Vehicle"
              )
              +
              " "
              +
              label
              +
              ": "
              +
              dateText(
                vehicle[key]
              )

            );

          }

        }
      );

    }
  );

  return alerts;
}


// ======================================================
// END PART 2
// PASTE PART 3 DIRECTLY BELOW THIS LINE
// ======================================================// ======================================================
// PART 3 OF 3
// RENDERING + REPORTS + WHATSAPP + AUTH STATE
// ======================================================


// ======================================================
// RENDER DASHBOARD
// ======================================================

function render(){

  if(
    currentProfile &&
    $("welcomeText")
  ){

    $("welcomeText").innerText =
      "Welcome " +
      (
        currentProfile.name ||
        OWNER_NAME
      ) +
      " • " +
      (
        currentProfile.role === "admin"
        ? "Admin"
        : "Manager"
      );
  }


  if($("statTotal")){

    $("statTotal").innerText =
      fleet.length;

  }


  if($("statRented")){

    $("statRented").innerText =
      fleet.filter(
        vehicle =>
          vehicle.status ===
          "Rented"
      ).length;

  }


  if($("statAvailable")){

    $("statAvailable").innerText =
      fleet.filter(
        vehicle =>
          vehicle.status ===
          "Available"
      ).length;

  }


  const weeklyIncome =
    fleet
      .filter(
        vehicle =>
          vehicle.status ===
          "Rented"
      )
      .reduce(
        (
          sum,
          vehicle
        ) =>
          sum +
          Number(
            vehicle.weekly_rent ||
            0
          ),
        0
      );


  if($("statWeekly")){

    $("statWeekly").innerText =
      money(
        weeklyIncome
      );

  }


  const outstanding =
    fleet.reduce(
      (
        sum,
        vehicle
      ) =>
        sum +
        Number(
          vehicle.outstanding ||
          0
        ),
      0
    );


  if($("statOutstanding")){

    $("statOutstanding").innerText =
      money(
        outstanding
      );

  }


  const alerts =
    buildAlerts();


  if($("statAlerts")){

    $("statAlerts").innerText =
      alerts.length;

  }


  if($("urgentAlerts")){

    $("urgentAlerts").innerHTML =

      alerts.length

      ? alerts
          .map(
            text =>
              `
                <p class="red">
                  ⚠️ ${text}
                </p>
              `
          )
          .join("")

      : `
          <p class="greenText">
            No urgent alerts
          </p>
        `;

  }


  renderVehicles();

  renderDrivers();
}


// ======================================================
// RENDER VEHICLES
// ======================================================

function renderVehicles(){

  if(!$("vehicleList")){
    return;
  }


  const search =
    (
      $("vehicleSearch")
      ?.value ||
      ""
    )
    .toLowerCase();


  const list =
    fleet.filter(
      vehicle => {

        const text =
          (
            vehicle.registration ||
            ""
          )
          +
          " "
          +
          (
            vehicle.make_model ||
            ""
          )
          +
          " "
          +
          (
            vehicle.driver_name ||
            ""
          );

        return text
          .toLowerCase()
          .includes(
            search
          );

      }
    );


  if(!list.length){

    $("vehicleList").innerHTML =
      `
        <div class="panel">
          <p>
            No vehicles yet.
          </p>
        </div>
      `;

    return;
  }


  $("vehicleList").innerHTML =
    list
      .map(
        vehicle => {

          const vehicleExpenses =
            expenses[
              vehicle.id
            ] || [];


          const totalExpenses =
            vehicleExpenses
              .reduce(
                (
                  sum,
                  expense
                ) =>
                  sum +
                  Number(
                    expense.amount ||
                    0
                  ),
                0
              );


          return `

            <div class="vehicle-card">

              <div class="row">

                <h2>
                  ${
                    vehicle.registration ||
                    "No Plate"
                  }
                </h2>

                <span class="badge">
                  ${
                    vehicle.status ||
                    "-"
                  }
                </span>

              </div>


              <p>

                <b>
                  ${
                    vehicle.make_model ||
                    "-"
                  }
                </b>

                ${
                  vehicle.year
                  ?
                    "(" +
                    vehicle.year +
                    ")"
                  :
                    ""
                }

              </p>


              <p>
                👨‍✈️
                ${
                  vehicle.driver_name ||
                  "-"
                }
              </p>


              <p>
                📞
                ${
                  vehicle.driver_phone ||
                  "-"
                }
              </p>


              <p>
                💷
                ${
                  money(
                    vehicle.weekly_rent
                  )
                }
                /week
              </p>


              <p>
                Deposit:
                ${
                  money(
                    vehicle.deposit
                  )
                }
              </p>


              <p class="${
                Number(
                  vehicle.outstanding ||
                  0
                ) > 0

                ? "red"

                : "greenText"
              }">

                Outstanding:
                ${
                  money(
                    vehicle.outstanding
                  )
                }

              </p>


              <p>

                🛠 Total Expenses:

                <b>
                  ${
                    money(
                      totalExpenses
                    )
                  }
                </b>

              </p>


              <hr>


              <p class="${
                statusClass(
                  vehicle.mot_expiry,
                  30
                )
              }">

                MOT:

                ${
                  vehicle.mot_expiry ||
                  "-"
                }

                (
                  ${
                    dateText(
                      vehicle.mot_expiry
                    )
                  }
                )

              </p>


              <p class="${
                statusClass(
                  vehicle.tax_expiry,
                  14
                )
              }">

                Road Tax:

                ${
                  vehicle.tax_expiry ||
                  "-"
                }

                (
                  ${
                    dateText(
                      vehicle.tax_expiry
                    )
                  }
                )

              </p>


              <p class="${
                statusClass(
                  vehicle.insurance_expiry,
                  30
                )
              }">

                Insurance:

                ${
                  vehicle.insurance_expiry ||
                  "-"
                }

                (
                  ${
                    dateText(
                      vehicle.insurance_expiry
                    )
                  }
                )

              </p>


              <p class="${
                statusClass(
                  vehicle.inspection_expiry,
                  30
                )
              }">

                Taxi Inspection:

                ${
                  vehicle.inspection_expiry ||
                  "-"
                }

                (
                  ${
                    dateText(
                      vehicle.inspection_expiry
                    )
                  }
                )

              </p>


              <p class="${
                statusClass(
                  vehicle.service_due,
                  30
                )
              }">

                Service:

                ${
                  vehicle.service_due ||
                  "-"
                }

                (
                  ${
                    dateText(
                      vehicle.service_due
                    )
                  }
                )

              </p>


              <p class="${
                statusClass(
                  vehicle.licence_expiry,
                  30
                )
              }">

                Driver Licence:

                ${
                  vehicle.licence_expiry ||
                  "-"
                }

                (
                  ${
                    dateText(
                      vehicle.licence_expiry
                    )
                  }
                )

              </p>


              <p class="${
                statusClass(
                  vehicle.badge_expiry,
                  30
                )
              }">

                Taxi Badge:

                ${
                  vehicle.badge_expiry ||
                  "-"
                }

                (
                  ${
                    dateText(
                      vehicle.badge_expiry
                    )
                  }
                )

              </p>


              <h3>
                🧾 Expense History
              </h3>


              ${
                vehicleExpenses.length

                ? vehicleExpenses
                    .map(
                      expense => `

                        <div class="doc">

                          <b>
                            ${
                              expense.description ||
                              "Expense"
                            }
                          </b>

                          <br>

                          💷
                          ${
                            money(
                              expense.amount
                            )
                          }

                          <br>

                          🏢 Garage:
                          ${
                            expense.garage ||
                            "-"
                          }

                          <br>

                          💳 Paid by:
                          ${
                            expense.paid_by ||
                            "-"
                          }

                          <br>

                          📅
                          ${
                            expense.expense_date ||
                            "-"
                          }

                          <br>


                          ${
                            expense.receipt_path

                            ? `
                                <button
                                  onclick="openPrivateFile('${expense.receipt_path}')">
                                  View Receipt
                                </button>
                              `

                            : ""
                          }


                          <button
                            class="danger"
                            onclick="deleteExpense('${expense.id}')">
                            Delete Expense
                          </button>

                        </div>

                      `
                    )
                    .join("")

                : `
                    <p class="small">
                      No expenses recorded.
                    </p>
                  `
              }


              <h3>
                📂 Documents & Photos
              </h3>


              ${
                documentList(
                  vehicle.id
                )
              }


              <div class="doc-grid">

                ${
                  documentUploadBox(
                    vehicle.id,
                    "vehicle_photo",
                    "Vehicle Photo"
                  )
                }

                ${
                  documentUploadBox(
                    vehicle.id,
                    "driver_photo",
                    "Driver Photo"
                  )
                }

                ${
                  documentUploadBox(
                    vehicle.id,
                    "driver_licence",
                    "Driver Licence"
                  )
                }

                ${
                  documentUploadBox(
                    vehicle.id,
                    "driver_badge",
                    "Driver Taxi Badge"
                  )
                }

                ${
                  documentUploadBox(
                    vehicle.id,
                    "insurance_certificate",
                    "Insurance Certificate"
                  )
                }

                ${
                  documentUploadBox(
                    vehicle.id,
                    "mot_certificate",
                    "MOT Certificate"
                  )
                }

                ${
                  documentUploadBox(
                    vehicle.id,
                    "v5c_logbook",
                    "V5C Logbook"
                  )
                }

                ${
                  documentUploadBox(
                    vehicle.id,
                    "taxi_licence",
                    "Taxi Licence / Plate"
                  )
                }

              </div>


              <p class="small">

                Notes:
                ${
                  vehicle.notes ||
                  "-"
                }

              </p>


              <button
                class="blue"
                onclick="editVehicle('${vehicle.id}')">
                Edit Vehicle
              </button>


              <button
                class="blue"
                onclick="addExpense('${vehicle.id}')">
                Add Expense
              </button>


              <button
                onclick="whatsapp('${vehicle.id}')">
                WhatsApp Driver + Me
              </button>


              <button
                class="danger"
                onclick="deleteVehicle('${vehicle.id}')">
                Delete Vehicle
              </button>

            </div>

          `;

        }
      )
      .join("");
}


// ======================================================
// RENDER DRIVERS
// ======================================================

function renderDrivers(){

  if(!$("driverList")){
    return;
  }


  const drivers =
    fleet.filter(
      vehicle =>
        vehicle.driver_name
    );


  if(!drivers.length){

    $("driverList").innerHTML =
      `
        <p>
          No drivers yet.
        </p>
      `;

    return;
  }


  $("driverList").innerHTML =
    drivers
      .map(
        vehicle => `

          <div class="card">

            <h3>
              ${
                vehicle.driver_name
              }
            </h3>


            <p>
              Vehicle:
              ${
                vehicle.registration ||
                "-"
              }
            </p>


            <p>
              Phone:
              ${
                vehicle.driver_phone ||
                "-"
              }
            </p>


            <p class="${
              statusClass(
                vehicle.licence_expiry,
                30
              )
            }">

              Licence:
              ${
                dateText(
                  vehicle.licence_expiry
                )
              }

            </p>


            <p class="${
              statusClass(
                vehicle.badge_expiry,
                30
              )
            }">

              Badge:
              ${
                dateText(
                  vehicle.badge_expiry
                )
              }

            </p>

          </div>

        `
      )
      .join("");
}


// ======================================================
// REPORTS
// ======================================================

function report(){

  if(!$("reportBox")){
    return;
  }


  const monthlyIncome =
    fleet.reduce(
      (
        sum,
        vehicle
      ) => {

        if(
          vehicle.status !==
          "Rented"
        ){

          return sum;

        }

        return (

          sum

          +

          (
            Number(
              vehicle.weekly_rent ||
              0
            )

            *

            52

            /

            12
          )

        );

      },
      0
    );


  const totalExpenses =
    Object
      .values(
        expenses
      )
      .flat()
      .reduce(
        (
          sum,
          expense
        ) =>
          sum +
          Number(
            expense.amount ||
            0
          ),
        0
      );


  const outstanding =
    fleet.reduce(
      (
        sum,
        vehicle
      ) =>
        sum +
        Number(
          vehicle.outstanding ||
          0
        ),
      0
    );


  $("reportBox").innerHTML = `

    Estimated Monthly Rent:

    <b>
      ${
        money(
          monthlyIncome
        )
      }
    </b>

    <br><br>


    Recorded Expenses:

    <b>
      ${
        money(
          totalExpenses
        )
      }
    </b>

    <br><br>


    Outstanding:

    <b>
      ${
        money(
          outstanding
        )
      }
    </b>

    <br><br>


    Estimated Profit:

    <b>
      ${
        money(
          monthlyIncome -
          totalExpenses
        )
      }
    </b>

  `;

}


// ======================================================
// WHATSAPP
// ======================================================

function whatsapp(vehicleId){

  const vehicle =
    fleet.find(
      item =>
        item.id ===
        vehicleId
    );


  if(!vehicle){
    return;
  }


  const driverPhone =
    (
      vehicle.driver_phone ||
      ""
    )
    .replace(
      /[^0-9]/g,
      ""
    );


  const driverMessage =

`Hi ${vehicle.driver_name || ""},

Reminder from Car 4 U 1 Ltd.

Vehicle: ${vehicle.registration || "-"}
Weekly rent: ${money(vehicle.weekly_rent)}
Outstanding: ${money(vehicle.outstanding)}

Thank you.`;


  if(driverPhone){

    window.open(

      "https://wa.me/"
      +
      driverPhone
      +
      "?text="
      +
      encodeURIComponent(
        driverMessage
      ),

      "_blank"

    );

  }


  setTimeout(
    () => {

      const ownerMessage =

`Hi ${OWNER_NAME},

Car 4 U 1 Fleet Manager

Vehicle: ${vehicle.registration || "-"}
Driver: ${vehicle.driver_name || "-"}
Driver phone: ${vehicle.driver_phone || "-"}
Weekly rent: ${money(vehicle.weekly_rent)}
Outstanding: ${money(vehicle.outstanding)}
Status: ${vehicle.status || "-"}`;


      window.open(

        "https://wa.me/"
        +
        OWNER_PHONE
        +
        "?text="
        +
        encodeURIComponent(
          ownerMessage
        ),

        "_blank"

      );

    },
    800
  );

}


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
// END OF V8 app.js
// ======================================================