import "/node_modules/bootstrap/dist/js/bootstrap.bundle.min.js";

let serverURL = "http://exam-2023-1-api.std-900.ist.mospolytech.ru/api/";
let apiKey = new URLSearchParams({"api_key": "11e64bf6-10f0-4d32-ad87-fd52492ac927"});

class Route {
  constructor({id, name, description, mainObject, coords, created_at} = {}) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.mainObject = mainObject;
    this.coords = coords;
    this.created_at = created_at;
  }
}

let routes = [];
let currentPage = 1;
let maxRoutesOnPage = 10;
let currentRoute = new Route();
let mainObjectsSet = new Set();
let currentRoutes = [];
let nameFilterValue = "";
let mainObjectFilterValue = "none";
let routeDescriptionMaxLength = 100;
let routeMainObjectMaxLength = 100;

async function getRoutes() {
    try {
      let response = await fetch(serverURL + "routes?" + apiKey);
      
      let data = await response.json();
      if (!response.ok) {
        if (data["error"] !== undefined) {
          showAlert(data["error"], "warning");
          return;
        }
        showAlert(await response.text(), "warning");
        return;
      }
  
      if (data["error"] !== undefined) {
        showAlert(data["error"], "warning");
        return;
      }
  
      for (let routeJson of data) {
        let route = new Route({id: routeJson.id, name: routeJson.name, description: routeJson.description, mainObject: routeJson.mainObject, coords: routeJson.coords, created_at: routeJson.created_at});
        routes.push(route);
      }
      currentRoutes = routes;
      await showRoutes();
      addMainObjectsOptions();
    } catch (err) {
      showAlert(err, "warning");
    }
  }

  async function  showRoutes() {
    let routesTable = document.querySelector(".routes__table");
    // TODO: edit logic of rerender routes block to dont rerender all table every time
    routesTable.replaceChildren();
    if (currentRoutes.length === 0) {
      let infoBlock = document.createElement('p');
      infoBlock.innerHTML = "По данному запросу ничего не найдено!";
      infoBlock.classList.add('fs-3', 'text-info');
      routesTable.append(infoBlock);
      return;
    }
    let routeTableTemplate = document.getElementById("routes__table__template");
    routesTable.append(routeTableTemplate.content.firstElementChild.cloneNode(true));
    let routesTableBody = routesTable.querySelector(".routes__table-body");
    let first = (currentPage - 1) * maxRoutesOnPage;
    for (let i = first; i < Math.min(first + maxRoutesOnPage, currentRoutes.length); i++) {
      let newRouteRow = createRouteRow(currentRoutes[i]);
      routesTableBody.append(newRouteRow);
    }
    showPaginationButtons();
  }

  function addMainObjectsOptions() {
    routes.forEach((route) => route.mainObject.split(" - ").forEach((mainObject) => {
        if (mainObject !== undefined && mainObject.trim() !== '') 
          mainObjectsSet.add(mainObject.trim());
      })
    );

    let mainObjectSelect = document.querySelector('#main-object__select');
    for (let mainObject of mainObjectsSet) {
      let option = document.createElement("option");
      option.value = mainObject;
      option.text = mainObject.slice(0, routeMainObjectMaxLength);
      mainObjectSelect.append(option);
    }
  }

  function showPaginationButtons() {
    let pagesCount = Math.ceil(currentRoutes.length / maxRoutesOnPage);
    let pageNumberTemplate = document.getElementById("pagination__button");
    let routesPagination = document.querySelector('.routes__table__pagination');
    routesPagination.querySelectorAll('.page-number').forEach((el) => el.remove());
    if (currentPage === 1) {
      document.getElementById("routes-previous-page-btn").classList.add("disabled");
    }
    else {
      document.getElementById("routes-previous-page-btn").classList.remove("disabled");
    }

    if (currentPage === pagesCount) {
      document.getElementById("routes-next-page-btn").classList.add("disabled");
    }
    else {
      document.getElementById("routes-next-page-btn").classList.remove("disabled");
    }

    if (pagesCount === 1) {
      let newPageNumberBlock = pageNumberTemplate.content.firstElementChild.cloneNode(true);
      newPageNumberBlock.classList.add("active");
      routesPagination.querySelector("#routes-next-page-btn").before(newPageNumberBlock);
      routesPagination.querySelectorAll('.page-item').forEach((el) => {
        if (!el.classList.contains("active")) {
          el.classList.add("disabled")
        }
      })
      return;
    }

    let first = 1;
    let second = first + 2;
    if (pagesCount < 3) {
      second = pagesCount;
    }
    else {
      if (currentPage === pagesCount) {
        first = currentPage - 2;
      }
      else if (currentPage !== 1) {
        first = currentPage - 1;
      }
      second = first + 2;
    }

    for (let i = first; i <= second; i++) {
      let newPageNumberBlock = pageNumberTemplate.content.firstElementChild.cloneNode(true);
      newPageNumberBlock.querySelector('.page-link').innerHTML = i;
      if (i === currentPage) {
        newPageNumberBlock.classList.add("active");
      }
      routesPagination.querySelector("#routes-next-page-btn").before(newPageNumberBlock);
    }

    routesPagination.onclick = (e) => handlePaginationButtonTap(e.target);
  }

  function handlePaginationButtonTap(target) {
    if (target.classList.contains("disabled")) return;
    let content = target.innerHTML;
    if (target.querySelector("span") != undefined) {
      content = target.querySelector("span").innerHTML;
    }
    if (content === "‹") {
      currentPage--;
    }
    else if (content === "›") {
      currentPage++;
    }
    else if (typeof Number(content) === 'number') {
      if (currentPage === Number(content)) return;
      currentPage = Number(content);
    }
    else {
      return;
    }
    showRoutes();
  }

  function handleChangeRoutesNameFilterValue(event) {
    if (nameFilterValue === event.target.value) return;
    nameFilterValue = event.target.value.toLowerCase();
    filterRoutes();
  }

  function handleChangeRoutesMainObjectFilterValue(event) {
    if (mainObjectFilterValue === event.target.value) return;
    mainObjectFilterValue = event.target.value;
    filterRoutes();
  }

  function filterRoutes() {
    if ((mainObjectFilterValue === undefined || mainObjectFilterValue === "none") && (nameFilterValue === "")) {
      currentRoutes = routes;
    }
    else {
      let newRoutes = [];
      for (let route of routes) {
        if (route.name.toLowerCase().includes(nameFilterValue) && (mainObjectFilterValue === "none" || route.mainObject.includes(mainObjectFilterValue))) {
          newRoutes.push(route);
        }
      }
      currentRoutes = newRoutes;
    }
    currentPage = 1;
    showRoutes();
  }

  async function handleChangeCurrentRoute(newRoute) {
    if (currentRoute.id == undefined) {
      showGuidesBlock();
    }
    currentRoute = newRoute;
    await getGuides(currentRoute);
  }

  function createRouteRow(route) {
    let routeTemplate = document.getElementById("route__template");
    let newRouteRow = routeTemplate.content.firstElementChild.cloneNode(true);
    newRouteRow.querySelector('.route__name').innerHTML = route.name;
    let routeDescription = route.description;
    if (routeDescription.length > routeDescriptionMaxLength) {
      routeDescription = routeDescription.slice(0, routeDescriptionMaxLength) + "...";
      newRouteRow.querySelector('.route__description').setAttribute('title', route.description);
      newRouteRow.querySelector('.route__description').setAttribute('data-bs-toggle', "tooltip");
    }
    newRouteRow.querySelector('.route__description').innerHTML = routeDescription;
    let routeMainObjects = route.mainObject;
    if (routeMainObjects.length > routeMainObjectMaxLength) {
      routeMainObjects = routeMainObjects.slice(0, routeMainObjectMaxLength) + "...";
      newRouteRow.querySelector('.route__main-objects').setAttribute('title', route.mainObject);
      newRouteRow.querySelector('.route__main-objects').setAttribute('data-bs-toggle', "tooltip");
    }
    newRouteRow.querySelector('.route__main-objects').innerHTML = routeMainObjects;
    if (currentRoute === route) newRouteRow.classList.add('table-active');
    newRouteRow.querySelectorAll('.route__button').forEach((button) => button.onclick = async () => {
        if (currentRoute !== route) {
          for (let row of document.querySelector(".routes__table-body").children) {
            row.classList.remove('table-active');
          }
          newRouteRow.classList.add('table-active');
          await handleChangeCurrentRoute(route);
        }
      }
    )
    return newRouteRow;
  }

class Guide {
  constructor({ id, name, workExperience, language, pricePerHour, route_id }={}) {
    this.id = id;
    this.name = name;
    this.workExperience = workExperience;
    this.language = language;
    this.pricePerHour = pricePerHour;
    this.route_id = route_id;
  }
}


let guides = []
let currentGuides = [];
let currentGuide = new Guide();
let languagesSet = new Set();
let languageFilterValue = "none";
let workExpFromFilterValue = undefined;
let workExpToFilterValue = undefined;



  async function getGuides(route) {
    document.querySelector('.guides__route-name').innerHTML = route.name;
    let guidesTable = document.getElementById("guides__table__container");
    guidesTable.replaceChildren();
    clearFilterValue();
    try {
      let response = await fetch(serverURL + `routes/${route.id}/guides?` + apiKey);
  
      let data = await response.json();
      if (!response.ok) {
        if (data["error"] !== undefined) {
          showAlert(data["error"], "warning");
          return;
        }
        showAlert(await response.text(), "warning");
        
        return;
      }
      
      if (data["error"] !== undefined) {
        showAlert(data["error"], "warning");
      
        return;
      }
      
      guides = [];
      for (let guideJson of data) {
        let guide = new Guide({id: guideJson.id, name: guideJson.name, workExperience: guideJson.workExperience, language: guideJson.language, pricePerHour: guideJson.pricePerHour, route_id: guideJson.route_id});
        guides.push(guide);
      }
      currentGuides = guides;
      showGuides();
      addLanguageOptions();
    } catch (err) {
      showAlert(err, "warning");
    
    }
  }

  function showGuides() {
    let guidesTable = document.getElementById("guides__table__container");
    guidesTable.replaceChildren();
    let guideTableTemplate = document.getElementById("guides__table__template");
    guidesTable.append(guideTableTemplate.content.firstElementChild.cloneNode(true));
    let guidesTableBody = guidesTable.querySelector(".guides__table-body");
    for (let guide of currentGuides) {
      let newGuideRow = createGuideRow(guide);
      guidesTableBody.append(newGuideRow);
    }
  }

  function createGuideRow(guide) {
    let guideRowTemplate = document.getElementById("guide__row__template");
    let newGuideRow = guideRowTemplate.content.firstElementChild.cloneNode(true);
    newGuideRow.querySelector('.guide__fio').innerHTML = guide.name;
    newGuideRow.querySelector('.guide__language').innerHTML = guide.language;
    newGuideRow.querySelector('.guide__work__exp').innerHTML = guide.workExperience;
    newGuideRow.querySelector('.guide__price').innerHTML = guide.pricePerHour;
    if (currentGuide === guide) newGuideRow.classList.add('table-active');
    newGuideRow.querySelectorAll('.guide__button').forEach((button) => button.onclick = () => {
        if (currentGuide !== guide) {
          currentGuide = guide
          for (let row of document.querySelector(".guides__table-body").children) {
            row.classList.remove('table-active');
          }
          newGuideRow.classList.add('table-active');
        }
        showCreateOrderBtn();
      }
    )
    return newGuideRow;
  }

  function showGuidesBlock() {
    let guidesBlock = document.getElementById('guides__block__template').content.firstElementChild.cloneNode(true);
    document.getElementById('routes').after(guidesBlock);

    guidesBlock.querySelector('#guide__language__select').onchange = (e) => handleChangeGuidesLanguageFilterValue(e);
    guidesBlock.querySelector('input[name="work__exp__from"]').oninput = (e) => handleChangeWorkExpFromFilterValue(e);
    guidesBlock.querySelector('input[name="work__exp__to"]').oninput = (e) => handleChangeWorkExpToFilterValue(e);
  }

  function clearFilterValue() {
    let guidesBlock = document.getElementById('guides');
    guidesBlock.querySelector('#guide__language__select').value = "none";
    guidesBlock.querySelector('input[name="work__exp__from"]').value = "";
    guidesBlock.querySelector('input[name="work__exp__to"]').value = "";
    languageFilterValue = "none";
    workExpFromFilterValue = undefined;
    workExpToFilterValue = undefined;

    deleteCreateOrderBtn();
  }

  function deleteCreateOrderBtn() {
    if (document.getElementById('create__order__btn') !== null) {
      document.getElementById('create__order__btn').remove();
    }
  }

  function showCreateOrderBtn() {
    if (document.getElementById('create__order__btn') === null) {
      let guidesTable = document.getElementById('guides__table');
      let createOrderBtn = document.getElementById('create__order__btn__template').content.firstElementChild.cloneNode(true);
      guidesTable.after(createOrderBtn);
    }
  }

  function addLanguageOptions() {
    guides.forEach((guide) => languagesSet.add(guide.language));

    let languageSelect = document.querySelector('#guide__language__select');
    for (let language of languagesSet) {
      let option = document.createElement("option");
      option.value = language;
      option.text = language;
      languageSelect.append(option);
    }
  }

  function handleChangeGuidesLanguageFilterValue(event) {
    if (languageFilterValue === event.target.value) return;
    languageFilterValue = event.target.value;
    filterGuides();
  }

  function handleChangeWorkExpFromFilterValue(event) {
    if (workExpFromFilterValue === event.target.value) return;
    workExpFromFilterValue = event.target.value;
    filterGuides();
  }
  
  function handleChangeWorkExpToFilterValue(event) {
    if (workExpToFilterValue === event.target.value) return;
    workExpToFilterValue = event.target.value;
    filterGuides();
  }

  function filterGuides() {
    if (languageFilterValue === "none" 
      && workExpToFilterValue === undefined 
      && workExpFromFilterValue === undefined) {
      currentGuides = guides;
    }
    else {
      let newGuides = [];
      for (let guide of guides) {
        if ((languageFilterValue === "none" || guide.language.includes(languageFilterValue)) 
        && (workExpFromFilterValue === undefined || guide.workExperience >= workExpFromFilterValue) 
        && (workExpToFilterValue === undefined || guide.workExperience <= workExpToFilterValue)) {
          newGuides.push(guide);
        }
      }
      currentGuides = newGuides;
    }
    showGuides();
  }

class Order {
  constructor({ id, guideId, routeId, date, time, duration, persons, price, optionFirst, optionSecond, studentId }={}) {
    this.id = id;
    this.guideId = guideId;
    this.routeId = routeId;
    this.date = date;
    this.time = time;
    this.duration = duration;
    this.persons = persons;
    this.price = price;
    this.optionFirst = optionFirst;
    this.optionSecond = optionSecond;
    this.studentId = studentId;
  }
}


let titles = {
  'create': 'Оформление заявки',
  'edit': 'Редактирование заявки',
  'show': 'Заявка номер '
};

let actionBtnText = {
  'create': 'Оформить',
  'edit': 'Сохранить',
}
let celebrationDays = [new Date("2024-01-08"), new Date("2024-02-23"), new Date("2024-03-08"), new Date("2024-04-29"), new Date("2024-04-30"), new Date("2024-05-01"), new Date("2024-05-09"), new Date("2024-05-10"), new Date("2024-06-12"), new Date("2024-11-04"), new Date("2024-12-30"), new Date("2024-12-31")];


function resetForm(form) {
    form.querySelector('#date').valueAsDate = new Date();
    form.querySelector('#time').value = "09:00";
    form.querySelector('#duration').value = "1";
    form.querySelector('#people__count').value = 1;
    form.querySelector('#option1').checked = false;
    form.querySelector('#option2').checked = false;
    form.querySelector("#order__price").innerHTML = getOrderPrice(form);
  }

  function setFormValues(form, action) {
    form.elements['action'].value = action;
    form.elements['route-id'].value = currentRoute.id;
    form.elements['guide-id'].value = currentGuide.id;
    document.querySelector('.modal-title').textContent = titles[action];
    document.querySelector('.action-order-btn').textContent = actionBtnText[action];
    form.querySelector('#guide__fio').value = currentGuide.name;
    form.querySelector('#route__name').value = currentRoute.name;
    form.onchange = () => form.querySelector('#order__price').innerHTML = getOrderPrice(form);
  }

  function getOrderPrice(form) {
    let date = form.querySelector('#date').valueAsDate;
    let isThisDayOff = false;
    if (date.getDay() === 0) {
      isThisDayOff = true;
    } else if (date.getDay() === 6 && date !== new Date("2024-04-27") 
    && date !== new Date("2024-11-02") && date !== new Date("2024-12-28")) {
      isThisDayOff = true;
    } else {
      isThisDayOff = celebrationDays.find(celebrationDay => celebrationDay.getTime() === date.getTime())
    }
    let time = form.querySelector('#time').value.split(":").map((it) => parseInt(it));
    let parsedTime = time[0] * 60 + time[1];
    let startMorningTime = 9 * 60; // 09:00 hour * minutes
    let endMorningTime = 12 * 60;
    let isMorningTime = parsedTime >= startMorningTime && parsedTime <= endMorningTime;
    let startEveningTime = 20 * 60;
    let endEveningTime = 23 * 60;
    let isEveningTime = parsedTime >= startEveningTime && parsedTime <= endEveningTime;
    let price = currentGuide.pricePerHour * parseInt(form.querySelector("#duration").value) * (isThisDayOff ? 1.5 : 1);
    if (isMorningTime) {
      price += 400;
    }
    if (isEveningTime) {
      price += 1000;
    }
    let numberOfVisitors = parseInt(form.querySelector("#people__count").value);
    if (numberOfVisitors >= 5 && numberOfVisitors < 10) {
      price += 1000;
    } else if (numberOfVisitors >= 10 && numberOfVisitors <= 20) {
      price += 1500;
    }
    let isOption1Enable = form.querySelector("#option1").checked;
    let isOption2Enable = form.querySelector("#option2").checked;
    if (isOption1Enable) {
        price *= 0.85;
      }
    if (isOption2Enable) {
      price += numberOfVisitors * 500;
    }
    
    return Math.ceil(price);
  }

  async function createOrder(order) {
    let formData = new FormData();
    formData.set("guide_id", order.guideId);
    formData.set("route_id", order.routeId);
    formData.set("date", order.date);
    formData.set("time", order.time);
    formData.set("duration", order.duration);
    formData.set("persons", order.persons);
    formData.set("price", order.price);
    formData.set("optionFirst", order.optionFirst);
    formData.set("optionSecond", order.optionSecond);
    try {
        let response = await fetch(serverURL + `orders?` + apiKey, {
          method: "POST",
          body: formData,
        });
    
        let data = await response.json();
        if (!response.ok) {
          if (data["error"] !== undefined) {
            showAlert(data["error"], "warning");
            return;
          }
          showAlert(await response.text(), "warning")
          return;
        }
        
        if (data["error"] !== undefined) {
          showAlert(data["error"], "warning");
          return;
        }

        showAlert("Заявка успешно оформлена!");
    } catch (error) {
        showAlert(error, "warning")
    }
  }

  async function actionOrderBtnHandler(event) {
    let form = event.target.closest('.modal').querySelector('form');
    let action = form.elements['action'].value;
    let guideId = form.elements['guide-id'].value;
    let routeId = form.elements['route-id'].value;
    let date = form.elements['date'].value;
    let time = form.elements['time'].value;
    let duration = form.elements['duration'].value;
    let persons = form.elements['people__count'].value;
    let price = parseInt(form.querySelector('#order__price').textContent);
    let isOption1Enable = form.elements['option1'].checked;
    let isOption2Enable = form.elements['option2'].checked;
    
    if (action === 'create') {
      let order = new Order({ guideId: guideId, routeId: routeId, date: date, time: time, duration: duration, persons: persons, price: price, optionFirst: isOption1Enable, optionSecond: isOption2Enable });
      await createOrder(order);
    }
  }

function showAlert(msg, category='success') {
  let alerts = document.querySelector('.alerts');
  let template = document.getElementById('alert__template');
  let newAlert = template.content.firstElementChild.cloneNode(true);
  newAlert.querySelector('.msg').innerHTML = msg;
  newAlert.classList.add(`alert-${category}`);
  alerts.append(newAlert);
  setTimeout(() => newAlert.remove(), 5000);
}

window.onload = async function () {
  await getRoutes();

  document.getElementById("route__name__search").oninput = (e) => handleChangeRoutesNameFilterValue(e);
  document.getElementById("main-object__select").onchange = (e) => handleChangeRoutesMainObjectFilterValue(e);

  document.getElementById('order-modal').addEventListener('show.bs.modal', function (event) {
    let form = this.querySelector('form');
    console.log("kdjgkjj")
    resetForm(form)
    let action = event.relatedTarget.dataset.action || 'create';
    setFormValues(form, action)
  });

  document.querySelector('.action-order-btn').onclick = (e) => actionOrderBtnHandler(e);
}