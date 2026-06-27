let fleet = JSON.parse(localStorage.getItem("car4uFleetV7") || "[]");
let pin = localStorage.getItem("car4uPin") || "1234";
let editIndex = null;

const $ = id => document.getElementById(id);

function save(){ localStorage.setItem("car4uFleetV7", JSON.stringify(fleet)); }

function login(){
  if($("pinInput").value === pin){
    $("loginScreen").classList.add("hidden");
    $("app").classList.remove("hidden");
    render();
  } else alert("Wrong PIN");
}

function logout(){ location.reload(); }

function showTab(name){
  document.querySelectorAll(".tab").forEach(t=>t.classList.add("hidden"));
  $(name).classList.remove("hidden");
  if(name==="reports") report();
}

function days(d){
  if(!d) return "";
  return Math.ceil((new Date(d)-new Date())/86400000);
}

function statusClass(d, limit){
  let x=days(d);
  if(x==="") return "";
  if(x<0 || x<=7) return "red";
  if(x<=limit) return "orange";
  return "greenText";
}

function dateText(d){
  let x=days(d);
  if(x==="") return "No date";
  if(x<0) return "Expired";
  if(x===0) return "Today";
  return x+" days";
}

function newCar(){
  editIndex=null;
  $("vehicleFormTitle").innerText="Add Vehicle";
  document.querySelectorAll("#addVehicle input,#addVehicle textarea").forEach(x=>x.value="");
  $("status").value="Rented";
  showTab("addVehicle");
}

function saveVehicle(){
  let car={
    plate:$("plate").value.toUpperCase(),
    model:$("model").value,
    year:$("year").value,
    mileage:$("mileage").value,
    driver:$("driver").value,
    phone:$("phone").value,
    rent:+$("rent").value||0,
    deposit:+$("deposit").value||0,
    balance:+$("balance").value||0,
    expenses:+$("expenses").value||0,
    mot:$("mot").value,
    tax:$("tax").value,
    insurance:$("insurance").value,
    inspection:$("inspection").value,
    service:$("service").value,
    licence:$("licence").value,
    badge:$("badge").value,
    status:$("status").value,
    notes:$("notes").value,
    lastPaid: editIndex!==null ? fleet[editIndex].lastPaid : "",
    docs: editIndex!==null ? (fleet[editIndex].docs||{}) : {}
  };

  if(editIndex===null) fleet.push(car);
  else fleet[editIndex]=car;

  save();
  render();
  showTab("vehicles");
}

function editVehicle(i){
  let c=fleet[i]; editIndex=i;
  $("vehicleFormTitle").innerText="Edit Vehicle";
  ["plate","model","year","mileage","driver","phone","rent","deposit","balance","expenses","mot","tax","insurance","inspection","service","licence","badge","notes"].forEach(k=>{
    $(k).value=c[k]||"";
  });
  $("status").value=c.status||"Rented";
  showTab("addVehicle");
}

function deleteVehicle(i){
  if(confirm("Delete vehicle?")){
    fleet.splice(i,1);
    save(); render();
  }
}

function markPaid(i){
  fleet[i].lastPaid=new Date().toLocaleDateString();
  fleet[i].balance=0;
  save(); render();
}

function addBalance(i){
  let a=prompt("Outstanding rent £");
  if(a){ fleet[i].balance+=(+a||0); save(); render(); }
}

function addExpense(i){
  let a = prompt("Add expense amount £");

  if(a === null || a === "") return;

  let current = Number(fleet[i].expenses || 0);
  let amount = Number(a);

  if(isNaN(amount)){
    alert("Please enter a valid number");
    return;
  }

  fleet[i].expenses = current + amount;

  save();
  render();

  alert("Expense added: £" + amount);
}

function uploadDoc(i,type,input){
  let file=input.files[0];
  if(!file) return;
  let reader=new FileReader();
  reader.onload=e=>{
    if(!fleet[i].docs) fleet[i].docs={};
    fleet[i].docs[type]={name:file.name,data:e.target.result,date:new Date().toLocaleDateString()};
    save(); render();
  };
  reader.readAsDataURL(file);
}

function viewDoc(i,type){
  let d=fleet[i].docs&&fleet[i].docs[type];
  if(!d){ alert("No document saved"); return; }
  let w=window.open();
  w.document.write(`<iframe src="${d.data}" style="width:100%;height:100vh;border:0"></iframe>`);
}

function docBox(i,type,label){
  let d=fleet[i].docs&&fleet[i].docs[type];
  return `<div class="doc">
    <b>${label}</b>
    <input type="file" accept="image/*,.pdf" onchange="uploadDoc(${i},'${type}',this)">
    <button onclick="viewDoc(${i},'${type}')">${d?"View saved":"No document saved"}</button>
    ${d?`<p class="small">${d.name} - ${d.date}</p>`:""}
  </div>`;
}

function whatsapp(i){
  let c=fleet[i];
  let phone=(c.phone||"").replace(/[^0-9]/g,"");
  if(!phone){alert("No phone number");return;}
  let msg=`Hi ${c.driver}, reminder from Car 4 U 1 Ltd.%0A%0ACar: ${c.plate}%0AWeekly rent: £${c.rent}%0AOutstanding: £${c.balance}`;
  window.open("https://wa.me/"+phone+"?text="+msg,"_blank");
}

function render(){
  let q=($("vehicleSearch")?.value||"").toLowerCase();
  let list=fleet.filter(c=>((c.plate||"")+(c.model||"")+(c.driver||"")).toLowerCase().includes(q));

  $("statTotal").innerText=fleet.length;
  $("statRented").innerText=fleet.filter(c=>c.status==="Rented").length;
  $("statAvailable").innerText=fleet.filter(c=>c.status==="Available").length;
  $("statWeekly").innerText="£"+fleet.reduce((s,c)=>s+(c.status==="Rented"?c.rent:0),0);
  $("statOutstanding").innerText="£"+fleet.reduce((s,c)=>s+(+c.balance||0),0);

  let alerts=[];
  fleet.forEach(c=>{
    [["MOT","mot",30],["Tax","tax",14],["Insurance","insurance",30],["Inspection","inspection",30],["Service","service",30],["Licence","licence",30],["Badge","badge",30]].forEach(x=>{
      if(days(c[x[1]])!=="" && days(c[x[1]])<=x[2]) alerts.push(`${c.plate} ${x[0]}: ${dateText(c[x[1]])}`);
    });
  });
  $("statAlerts").innerText=alerts.length;
  $("urgentAlerts").innerHTML=alerts.length?alerts.map(a=>`<p class="red">⚠️ ${a}</p>`).join(""):"<p class='greenText'>No urgent alerts</p>";

  $("vehicleList").innerHTML="";
  list.forEach(c=>{
    let i=fleet.indexOf(c);
    let monthly=c.status==="Rented"?c.rent*4:0;
    let profit=monthly-(+c.expenses||0);

    $("vehicleList").innerHTML+=`
    <div class="vehicle-card">
      <div class="row"><h2>${c.plate||"No Plate"}</h2><span class="badge">${c.status}</span></div>
      <p><b>${c.model||"-"}</b> ${c.year?`(${c.year})`:""}</p>
      <p>👨‍✈️ ${c.driver||"-"}</p>
      <p>📞 ${c.phone||"-"}</p>
      <p>💷 £${c.rent}/week | Deposit £${c.deposit}</p>
      <p class="${c.balance>0?'red':'greenText'}">Outstanding: £${c.balance}</p>
      <p>🛠 Expenses: £${c.expenses}</p>
      <p class="${profit<0?'red':'greenText'}">Monthly profit estimate: £${profit}</p>
      <hr>
      <p class="${statusClass(c.mot,30)}">MOT: ${c.mot||"-"} (${dateText(c.mot)})</p>
      <p class="${statusClass(c.tax,14)}">Road Tax: ${c.tax||"-"} (${dateText(c.tax)})</p>
      <p class="${statusClass(c.insurance,30)}">Insurance: ${c.insurance||"-"} (${dateText(c.insurance)})</p>
      <p class="${statusClass(c.inspection,30)}">Taxi Inspection: ${c.inspection||"-"} (${dateText(c.inspection)})</p>
      <p class="${statusClass(c.licence,30)}">Driver Licence: ${c.licence||"-"} (${dateText(c.licence)})</p>
      <p class="${statusClass(c.badge,30)}">Taxi Badge: ${c.badge||"-"} (${dateText(c.badge)})</p>

      <h3>📂 Documents</h3>
      <div class="doc-grid">
        ${docBox(i,"driverLicence","Driver Licence")}
        ${docBox(i,"driverBadge","Driver Taxi Badge")}
        ${docBox(i,"insuranceCert","Insurance Certificate")}
        ${docBox(i,"motCert","MOT Certificate")}
        ${docBox(i,"logbook","V5C Logbook")}
        ${docBox(i,"taxiLicence","Taxi Licence / Plate")}
      </div>

      <p class="small">Notes: ${c.notes||"-"}</p>
      <button class="green" onclick="markPaid(${i})">Mark Rent Paid</button>
      <button class="blue" onclick="editVehicle(${i})">Edit</button>
      <button class="blue" onclick="addBalance(${i})">Add Balance</button>
      <button class="blue" onclick="addExpense(${i})">Add Expense</button>
      <button onclick="whatsapp(${i})">WhatsApp Reminder</button>
      <button class="danger" onclick="deleteVehicle(${i})">Delete</button>
    </div>`;
  });

  renderDrivers();
}

function renderDrivers(){
  $("driverList").innerHTML=fleet.filter(c=>c.driver).map(c=>`
    <div class="card">
      <h3>${c.driver}</h3>
      <p>Vehicle: ${c.plate}</p>
      <p>Phone: ${c.phone||"-"}</p>
      <p class="${statusClass(c.licence,30)}">Licence: ${dateText(c.licence)}</p>
      <p class="${statusClass(c.badge,30)}">Badge: ${dateText(c.badge)}</p>
    </div>`).join("") || "<p>No drivers yet</p>";
}

function report(){
  let income=fleet.reduce((s,c)=>s+(c.status==="Rented"?c.rent*4:0),0);
  let exp=fleet.reduce((s,c)=>s+(+c.expenses||0),0);
  let bal=fleet.reduce((s,c)=>s+(+c.balance||0),0);
  $("reportBox").innerHTML=`Monthly Income: <b>£${income}</b><br>Expenses: <b>£${exp}</b><br>Outstanding: <b>£${bal}</b><br>Estimated Profit: <b>£${income-exp}</b>`;
}

function exportBackup(){
  let blob=new Blob([JSON.stringify(fleet,null,2)],{type:"application/json"});
  let a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="car4u-fleet-backup.json";
  a.click();
}

function importBackup(e){
  let f=e.target.files[0];
  if(!f)return;
  let r=new FileReader();
  r.onload=()=>{fleet=JSON.parse(r.result);save();render();alert("Backup restored");};
  r.readAsText(f);
}

function changePin(){
  if($("newPin").value){
    pin=$("newPin").value;
    localStorage.setItem("car4uPin",pin);
    alert("PIN changed");
  }
}

function clearAll(){
  if(confirm("Delete all data?")){
    fleet=[];save();render();
  }
}

render();