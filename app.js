let fleet = JSON.parse(localStorage.getItem("car4uFleetV6") || "[]");
let editIndex = null;

function save(){
  localStorage.setItem("car4uFleetV6", JSON.stringify(fleet));
}

function $(id){
  return document.getElementById(id);
}

function days(d){
  if(!d) return "";
  return Math.ceil((new Date(d) - new Date()) / 86400000);
}

function colour(d, limit){
  let x = days(d);
  if(x === "") return "";
  if(x < 0 || x <= 7) return "red";
  if(x <= limit) return "orange";
  return "green";
}

function text(d){
  let x = days(d);
  if(x === "") return "No date";
  if(x < 0) return "Expired";
  if(x === 0) return "Today";
  return x + " days";
}

function tab(t){
  $("fleetTab").classList.toggle("hidden", t !== "fleet");
  $("addTab").classList.toggle("hidden", t !== "add");
  $("reportsTab").classList.toggle("hidden", t !== "reports");
  if(t === "reports") report();
}

function newCar(){
  editIndex = null;
  $("formTitle").innerText = "Add Vehicle";
  document.querySelectorAll("#addTab input,#addTab textarea").forEach(x => x.value = "");
  $("status").value = "Rented";
  tab("add");
}

function saveCar(){
  let car = {
    plate: $("plate").value.toUpperCase(),
    model: $("model").value,
    driver: $("driver").value,
    phone: $("phone").value,
    licence: $("licence").value,
    badge: $("badge").value,
    rent: +$("rent").value || 0,
    deposit: +$("deposit").value || 0,
    balance: +$("balance").value || 0,
    expenses: +$("expenses").value || 0,
    mot: $("mot").value,
    tax: $("tax").value,
    insurance: $("insurance").value,
    inspection: $("inspection").value,
    service: $("service").value,
    status: $("status").value,
    notes: $("notes").value,
    lastPaid: editIndex !== null ? fleet[editIndex].lastPaid : "",
    documents: editIndex !== null ? (fleet[editIndex].documents || {}) : {}
  };

  if(editIndex === null){
    fleet.push(car);
  } else {
    fleet[editIndex] = car;
  }

  save();
  render();
  tab("fleet");
}

function editCar(i){
  let c = fleet[i];
  editIndex = i;
  $("formTitle").innerText = "Edit Vehicle";

  $("plate").value = c.plate || "";
  $("model").value = c.model || "";
  $("driver").value = c.driver || "";
  $("phone").value = c.phone || "";
  $("licence").value = c.licence || "";
  $("badge").value = c.badge || "";
  $("rent").value = c.rent || "";
  $("deposit").value = c.deposit || "";
  $("balance").value = c.balance || "";
  $("expenses").value = c.expenses || "";
  $("mot").value = c.mot || "";
  $("tax").value = c.tax || "";
  $("insurance").value = c.insurance || "";
  $("inspection").value = c.inspection || "";
  $("service").value = c.service || "";
  $("status").value = c.status || "Rented";
  $("notes").value = c.notes || "";

  tab("add");
}

function del(i){
  if(confirm("Delete this vehicle?")){
    fleet.splice(i,1);
    save();
    render();
  }
}

function paid(i){
  fleet[i].lastPaid = new Date().toLocaleDateString();
  fleet[i].balance = 0;
  save();
  render();
}

function addBalance(i){
  let a = prompt("Add outstanding rent £");
  if(a){
    fleet[i].balance += (+a || 0);
    save();
    render();
  }
}

function addExpense(i){
  let a = prompt("Add repair / expense £");
  if(a){
    fleet[i].expenses += (+a || 0);
    save();
    render();
  }
}

function wa(i){
  let c = fleet[i];
  let phone = (c.phone || "").replace(/[^0-9]/g,"");

  if(!phone){
    alert("No driver phone number saved");
    return;
  }

  let msg = `Hi ${c.driver}, reminder from Car 4 U 1 Ltd.%0A%0ACar: ${c.plate}%0AWeekly rent: £${c.rent}%0AOutstanding: £${c.balance}%0APlease contact us.`;

  window.open("https://wa.me/" + phone + "?text=" + msg, "_blank");
}

function agreement(i){
  let c = fleet[i];
  let phone = (c.phone || "").replace(/[^0-9]/g,"");

  if(!phone){
    alert("No driver phone number saved");
    return;
  }

  let txt = `TAXI RENTAL AGREEMENT%0A%0ACar 4 U 1 Ltd%0ADriver: ${c.driver}%0AVehicle: ${c.model} ${c.plate}%0AWeekly Rent: £${c.rent}%0ADeposit: £${c.deposit}%0A%0ADriver agrees to pay rent weekly and keep vehicle in good condition.`;

  window.open("https://wa.me/" + phone + "?text=" + txt, "_blank");
}

function uploadDoc(i, type, input){
  let file = input.files[0];
  if(!file) return;

  let reader = new FileReader();

  reader.onload = function(e){
    if(!fleet[i].documents) fleet[i].documents = {};

    fleet[i].documents[type] = {
      name: file.name,
      data: e.target.result,
      date: new Date().toLocaleDateString()
    };

    save();
    render();
  };

  reader.readAsDataURL(file);
}

function viewDoc(i, type){
  let doc = fleet[i].documents && fleet[i].documents[type];

  if(!doc){
    alert("No document saved");
    return;
  }

  let w = window.open();
  w.document.write(`
    <html>
      <body style="font-family:Arial;padding:20px">
        <h2>${type}</h2>
        <p>${doc.name}</p>
        <p>Saved: ${doc.date}</p>
        <iframe src="${doc.data}" style="width:100%;height:80vh"></iframe>
      </body>
    </html>
  `);
}

function docBox(i, type, label){
  let has = fleet[i].documents && fleet[i].documents[type];

  return `
    <div class="doc-box">
      <b>${label}</b><br>
      <input type="file" accept="image/*,.pdf" onchange="uploadDoc(${i}, '${type}', this)">
      <button onclick="viewDoc(${i}, '${type}')">${has ? "View Saved Document" : "No Document Saved"}</button>
      ${has ? `<p class="small">Saved: ${has.date}</p>` : ""}
    </div>
  `;
}

function render(){
  let searchBox = $("search");
  let q = searchBox ? searchBox.value.toLowerCase() : "";

  let list = fleet.filter(c =>
    ((c.plate || "") + (c.model || "") + (c.driver || "")).toLowerCase().includes(q)
  );

  $("total").innerText = fleet.length;
  $("rented").innerText = fleet.filter(c => c.status === "Rented").length;
  $("available").innerText = fleet.filter(c => c.status === "Available").length;
  $("income").innerText = "£" + fleet.reduce((s,c)=>s+(c.status==="Rented"?c.rent:0),0);
  $("outstanding").innerText = "£" + fleet.reduce((s,c)=>s+(+c.balance||0),0);

  let a = 0;
  fleet.forEach(c=>{
    ["mot","tax","insurance","inspection","service","licence","badge"].forEach(k=>{
      if(days(c[k]) !== "" && days(c[k]) <= 30) a++;
    });
  });
  $("alerts").innerText = a;

  $("cars").innerHTML = "";

  list.forEach((c)=>{
    let i = fleet.indexOf(c);
    let monthly = c.status === "Rented" ? c.rent * 4 : 0;
    let profit = monthly - (+c.expenses || 0);

    $("cars").innerHTML += `
      <div class="card">
        <div class="row">
          <h2>${c.plate || "No Plate"}</h2>
          <span class="badge">${c.status || "-"}</span>
        </div>

        <p><b>${c.model || "-"}</b></p>
        <p>👨‍✈️ Driver: ${c.driver || "-"}</p>
        <p>📞 ${c.phone || "-"}</p>
        <p>💷 Rent: £${c.rent || 0}/week</p>
        <p>💰 Deposit: £${c.deposit || 0}</p>
        <p class="${c.balance > 0 ? "red" : "green"}">Outstanding: £${c.balance || 0}</p>
        <p>Last paid: ${c.lastPaid || "Not recorded"}</p>
        <p>🛠 Expenses: £${c.expenses || 0}</p>
        <p class="${profit < 0 ? "red" : "green"}">Monthly profit estimate: £${profit}</p>

        <hr>

        <p class="${colour(c.mot,30)}">MOT: ${c.mot || "-"} (${text(c.mot)})</p>
        <p class="${colour(c.tax,14)}">Road Tax: ${c.tax || "-"} (${text(c.tax)})</p>
        <p class="${colour(c.insurance,30)}">Insurance: ${c.insurance || "-"} (${text(c.insurance)})</p>
        <p class="${colour(c.inspection,30)}">Taxi Inspection: ${c.inspection || "-"} (${text(c.inspection)})</p>
        <p class="${colour(c.service,30)}">Service: ${c.service || "-"} (${text(c.service)})</p>
        <p class="${colour(c.licence,30)}">Driver Licence: ${c.licence || "-"} (${text(c.licence)})</p>
        <p class="${colour(c.badge,30)}">Taxi Badge: ${c.badge || "-"} (${text(c.badge)})</p>

        <h3>📂 Documents</h3>
        ${docBox(i, "driverLicence", "Driver Licence")}
        ${docBox(i, "driverTaxiBadge", "Driver Taxi Badge")}
        ${docBox(i, "insuranceCert", "Insurance Certificate")}
        ${docBox(i, "motCert", "MOT Certificate")}
        ${docBox(i, "logbook", "V5C Logbook")}
        ${docBox(i, "taxiLicence", "Taxi Licence / Plate")}

        <p class="small">Notes: ${c.notes || "-"}</p>

        <button class="greenbtn" onclick="paid(${i})">Mark Rent Paid</button>
        <button class="blue" onclick="editCar(${i})">Edit</button>
        <button class="blue" onclick="addBalance(${i})">Add Balance</button>
        <button class="blue" onclick="addExpense(${i})">Add Expense</button>
        <button onclick="wa(${i})">WhatsApp Reminder</button>
        <button onclick="agreement(${i})">Agreement Text</button>
        <button class="danger" onclick="del(${i})">Delete</button>
      </div>
    `;
  });
}

function report(){
  let income = fleet.reduce((s,c)=>s+(c.status==="Rented"?c.rent*4:0),0);
  let exp = fleet.reduce((s,c)=>s+(+c.expenses||0),0);
  let bal = fleet.reduce((s,c)=>s+(+c.balance||0),0);

  $("reportText").innerHTML =
    `Monthly income estimate: <b>£${income}</b><br>
     Expenses: <b>£${exp}</b><br>
     Outstanding rent: <b>£${bal}</b><br>
     Estimated profit: <b>£${income-exp}</b>`;
}

function exportData(){
  let blob = new Blob([JSON.stringify(fleet,null,2)], {type:"application/json"});
  let a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "car4u-fleet-backup.json";
  a.click();
}

function importData(e){
  let f = e.target.files[0];
  if(!f) return;

  let r = new FileReader();
  r.onload = ()=>{
    fleet = JSON.parse(r.result);
    save();
    render();
    alert("Backup imported");
  };
  r.readAsText(f);
}

function clearAll(){
  if(confirm("Delete all fleet data?")){
    fleet = [];
    save();
    render();
  }
}

render();