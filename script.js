'use strict';

class Workout {
	date = new Date();
	id = (Date.now() + '').slice(-10);
	clicks = 0;

	constructor(coords, distance, duration) {
		// this.date = ... //? es6+ jer ovo gore van constructora jos kao valjda nije zvanicno podrzano.
		// this.id = ... //? es6+ jer ovo gore van constructora jos kao valjda nije zvanicno podrzano.
		this.coords = coords; //* [lat, lng]
		this.distance = distance; //* in km
		this.duration = duration; //* in min
		// this._setDescription(); //! ali ne treba ovde da je pozivamo, vec u childovima tj u klasama koje nasledjuju ovu Workout klasu, jer nam treba type za kalkulaciju, a to je u child-ovima definisano
	}

	_setDescription() {
		// prettier-ignore
		const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

		this.description = `${this.type[0].toUpperCase()}${this.type.slice(
			1
		)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`; // Running ili Cycling, da prvo slovo bude veliko. Potom kreiramo datum, dohvatamo mesec, vratice broj od 0 do 11, i onda taj broj stavljamo u months[taj_broj] i dohvatamo textualno mesec, i potom samo dan. Krajnje: Running on August 31
	}

	click() {
		this.clicks++;
	}
}

class Running extends Workout {
	type = 'running';

	constructor(coords, distance, duration, cadence) {
		super(coords, distance, duration);
		this.cadence = cadence;
		this.calcPace(); // return this.pace
		this._setDescription(); //! !!!!! i posto je metod executed ovde u constructoru, on ce takodj imati access ovom type
	}

	calcPace() {
		this.pace = this.duration / this.distance; // min/km
		return this.pace;
	}
}

class Cycling extends Workout {
	type = 'cycling';

	constructor(coords, distance, duration, elevationGain) {
		super(coords, distance, duration);
		this.elevationGain = elevationGain;
		this.calcSpeed();
		this._setDescription(); //! !!!!! i posto je metod executed ovde u constructoru, on ce takodj imati access ovom type
	}
	calcSpeed() {
		// km/h
		this.speed = this.distance / (this.duration / 60); //! delimo this.duration sa 60 jer nam trebaju sati, a on je u minut
		return this.speed;
	}
}

// const run1 = new Running([39, -12], 5.2, 24, 178); // coords, distanca, duration, cadence
// const cycling1 = new Cycling([39, -12], 27, 95, 523); // coords, distanca, duration, elevationGain
// console.log(run1, cycling1);
//////////////////////////////////////////////////
//? APLICATION ARCHITECTURE
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
	#map; //! private instance property
	#mapZoomLevel = 13;
	#mapEvent; //! private instance property
	#workouts = [];

	constructor() {
		//! constructor je executed cim napravimo instancu new App(), sto znaci da bismo tu mogli da pozovemo ovaj _getPosition() metod
		//? Get user position
		this._getPosition();

		//? Get data from local storage
		this._getLocalStorage();

		form.addEventListener('submit', this._newWorkout.bind(this)); //! obratiti paznju jer ovaj metod this._newWorkout ovde poziva event handler, a tu this oznacava element kom je event attached, dakle this koji koristimo u metodu _newWorkout ce ukazivati na form element. Zato ne treba pozivati kao this._newWorkout vec kao this._newWorkout.bind(this)

		// prettier-ignore
		inputType.addEventListener('change', this._toggleElevationField); //! Ovde unutar ovog _toggleElevationField metoda nigde ne koristimo this keyword, zato tu ne moramo da bajndujemp
		// prettier-ignore
		containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
	}

	_getPosition() {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				// this._loadMap, //* ova prva callback f-ja za parametar ima position, tj mozemo ga nazvati kako hocemo
				this._loadMap.bind(this), //! morali smo da bindujemo jer inace this bude undefined, i onda kada unutar tog metoda _getPosition() koristimo this, ono bude undefined
				function () {
					alert("Coudn't get ur position");
				}
			); //! Ova getCurrentPosition() f-ja za input prima 2 callback f-je: jedna je kada browser uspesno dohvati koodrdinate trenutne pozicije korisnika, a druga je kada je error prilikom dohvatanja koordinata.
		}
	}
	_loadMap(position) {
		//* ova prva callback f-ja za parametar ima position, tj mozemo ga nazvati kako hocemo
		const { latitude } = position.coords;
		const { longitude } = position.coords;
		console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

		const coords = [latitude, longitude];

		console.log(this); //! UNDEFINED ?!?!? a to je jer smo ovu f-ju napisali gore u _getPosition kao: this._loadMap ali nismo je pozvali sa (). Poziva se kao regularna f-ja, a u regularnom f-on call-u, this keyword je undefined. Zato manuelno bindujemo to sa bind()
		this.#map = L.map('map').setView(coords, this.#mapZoomLevel); //? ovo map('map'), tj ovo map pod navodnicima je ID nas u htmlu koji imamo gde treba da smestimo mapu

		L.tileLayer(
			'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
			// 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
			{
				attribution:
					'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
			}
		).addTo(this.#map);

		//? Handling clicks on map
		this.#map.on('click', this._showForm.bind(this));

		this.#workouts.forEach(work => {
			this._renderWorkoutMarker(work);
		});
	}
	_showForm(mapE) {
		this.#mapEvent = mapE; //! kopirali smo mapE u mapvent, jer ovde u ovom scope bloku nam ne treba mapE, ali jbg, samo odavde imamo pristup njoj, pa smo definisali globalnu varijablu sa let mapEvent i ovde joj dodelili vrednost mapE.
		form.classList.remove('hidden');
		inputDistance.focus();
	}

	_hideForm() {
		// prettier-ignore
		inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';
		form.style.display = 'none';
		form.classList.add('hidden');

		setTimeout(() => (form.style.display = 'grid'), 1000); //* ovo je nesto zbog animacije koju forma ima. nisam bas razumela
		// inputDistance.focus();
	}

	_toggleElevationField() {
		inputElevation
			.closest('.form__row')
			.classList.toggle('form__row--hidden'); //! closest() je kao inverse metod od querySelector, tj on selektuje parente, dok querySelector selektuje child-ove.
		inputCadence
			.closest('.form__row')
			.classList.toggle('form__row--hidden');
	}

	_newWorkout(e) {
		e.preventDefault();

		const validInputs = (...inputs) =>
			inputs.every(inp => Number.isFinite(inp)); //! (...inputs) rest aprametar, a kada kor rest parametar dobijamo array; ovo u f-ji bude niz sa tim vrednostima inputs, a potom za svaki taj input cekiramo da li je pozitivan (iliti finite). Ako i samo jedan nput bude false, odn da nije finite, onda ce za sve da bude false

		const alLPositive = (...inputs) => inputs.every(inp => inp > 0);

		//? Get data from form
		const type = inputType.value;
		const distance = +inputDistance.value; //! dodajemo isped znak plus + da bismo konverovali vrednost u Number
		const duration = +inputDuration.value; //! dodajemo isped znak plus + da bismo konverovali vrednost u Number
		const { lat, lng } = this.#mapEvent.latlng;
		let workout;

		//? If workout running, create running object
		if (type === 'running') {
			const cadence = +inputCadence.value;

			//? Check if data is valid
			if (
				// !Number.isFinite(distance) ||
				// !Number.isFinite(duration) ||
				// !Number.isFinite(cadence)
				!validInputs(distance, duration, cadence) ||
				!alLPositive(distance, duration, cadence)
			)
				return alert('Inputs have to be positive numbers');

			workout = new Running([lat, lng], distance, duration, cadence);
		}
		//? If workout cycling, create cycling object
		if (type === 'cycling') {
			const elevation = +inputElevation.value;

			if (
				!validInputs(distance, duration, elevation) ||
				!alLPositive(distance, duration)
			)
				return alert('Inputs have to be positive numbers');

			workout = new Cycling([lat, lng], distance, duration, elevation);
		}

		//? Add new objeect on map as marker
		this.#workouts.push(workout);
		// console.log(workout, workout.type);

		//? Render workout on map as marker
		this._renderWorkoutMarker(workout);

		//? Render workout on list
		this._renderWorkout(workout);

		//? Hide form + clear input fields
		this._hideForm();

		//? Set local storage to all workouts
		this._setLocalStorage();
	}
	_renderWorkoutMarker(workout) {
		L.marker(workout.coords)
			.addTo(this.#map)
			.bindPopup(
				L.popup({
					maxWidth: 250,
					minWidth: 100,
					autoClose: false,
					closeOnClick: false,
					className: `${workout.type}-popup`,
				})
			)
			.setPopupContent(
				`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${
					workout.description
				}`
			)
			.openPopup();
	}
	_renderWorkout(workout) {
		let html = `
			<li class="workout workout--${workout.type}" data-id="${workout.id}">
				<h2 class="workout__title">${workout.description}</h2>
				<div class="workout__details">
					<span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} </span>
					<span class="workout__value">${workout.distance}</span>
					<span class="workout__unit">km</span>
				</div>
				<div class="workout__details">
					<span class="workout__icon">⏱</span>
					<span class="workout__value">${workout.duration}</span>
					<span class="workout__unit">min</span>
				</div>
		`;

		if (workout.type === 'running')
			html += `
				<div class="workout__details">
					<span class="workout__icon">⚡️</span>
					<span class="workout__value">${workout.pace.toFixed(2)}</span>
					<span class="workout__unit">min/km</span>
				</div>
				<div class="workout__details">
					<span class="workout__icon">🦶🏼</span>
					<span class="workout__value">${workout.cadence}</span>
					<span class="workout__unit">spm</span>
				</div>
			</li>
			`;

		if (workout.type === 'cycling')
			html += `
				<div class="workout__details">
					<span class="workout__icon">⚡️</span>
					<span class="workout__value">${workout.speed.toFixed(2)}</span>
					<span class="workout__unit">km/h</span>
				</div>
				<div class="workout__details">
					<span class="workout__icon">⛰</span>
					<span class="workout__value">${workout.elevationGain}</span>
					<span class="workout__unit">m</span>
				</div>
			</li>
			`;

		//! Insertovacemo ovaj html ovde u HTML nakon form elementa, dakle kao sibling form elementu
		form.insertAdjacentHTML('afterend', html);
	}

	_moveToPopup(e) {
		const workoutEl = e.target.closest('.workout');
		// console.log(workoutEl);

		if (!workoutEl) return;

		const workout = this.#workouts.find(
			work => work.id === workoutEl.dataset.id
		);

		// console.log(workout);
		this.#map.setView(workout.coords, this.#mapZoomLevel, {
			animate: true,
			pan: {
				duration: 1,
			},
		});

		//? using the PUBLIC interface
		workout.click();
	}

	_setLocalStorage() {
		localStorage.setItem('workouts', JSON.stringify(this.#workouts));
	}
	_getLocalStorage() {
		//? Opaljuje se na pocetku, prilikom ucitavanja str, tj u constructoru klase App je. I tad je #workouts niz uvek biti prazan. Ali ako imamo vec neke podatke u LS, onda cemo ih dohvatiti i popuniti #workouts

		const data = JSON.parse(localStorage.getItem('workouts'));

		// Moramo da cekiramo da li ista ima u local storage. Ako nema bice undefined
		if (!data) return;

		// Ako ima data
		this.#workouts = data;

		this.#workouts.forEach(work => {
			this._renderWorkout(work);
			// this._renderWorkoutMarker(work) //! medjutim, ovo nece raditi, tj imacemo error, jer se ovde gde ovo koristimo #map jos nije ucitala. ZAto cemo premestiti gore u _loadMap()
		});
	}

	reset() {
		localStorage.removeItem('workouts');
		location.reload();
	}
}
const app = new App();
// app._getPosition();
//! !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
//! KADA KONVERTUJEMO OBJEKAT U STRING, PA POTOM STRING U OBJEKAT (KAO RECIMO ZA LOCAL STORAGE: JSON.STRINGIFY(), JSON.PARSE()), GUBIMO PROTOTYPE CHAIN, ZATO RECIMO ONAJ PUBLIC METOD CLICKS() NE RADI. ZATO POSTOJE PROBLEMI KAD SE RADI SA LOCALSTORAGE I OOP JAVASCRIPTOM
//! !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

/*
//? ADDITIONAL FEATURE IDEAS: CHALLENGES

//* 1. Ability to edit a workout
//* 2. Ability to delete a workout
//* 3. Ability to delete all workouts
//* 4. Ability to sort workouts by a certain field (e.g. distance)
//* 5. Re-build Running and Cycling object coming from LS
//* 6. More realistic error and confirmation messages
//* 7. Ability to position the map to show all workouts [very hard]
//* 8. Ability to draw lines and shapes instead of just points [very hard]
//* 9. Geocode location from coordinates ("Run in Faro, Portugal") [only for async JS section]
//* 10. Display weather data for workout time and place [only for async JS section]
*/
