'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

class Workout {
	date = new Date();
	id = (Date.now() + '').slice(-10);

	constructor(coords, distance, duration) {
		// this.date = ... //? es6+ jer ovo gore van constructora jos kao valjda nije zvanicno podrzano.
		// this.id = ... //? es6+ jer ovo gore van constructora jos kao valjda nije zvanicno podrzano.
		this.coords = coords; //* [lat, lng]
		this.distance = distance; //* in km
		this.duration = duration; //* in min
	}
}

class Running extends Workout {
	type = 'running';

	constructor(coords, distance, duration, cadence) {
		super(coords, distance, duration);
		this.cadence = cadence;
		this.calcPace(); // return this.pace
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
	#mapEvent; //! private instance property
	#workouts = [];

	constructor() {
		//! constructor je executed cim napravimo instancu new App(), sto znaci da bismo tu mogli da pozovemo ovaj _getPosition() metod
		this._getPosition();

		form.addEventListener('submit', this._newWorkout.bind(this)); //! obratiti paznju jer ovaj metod this._newWorkout ovde poziva event handler, a tu this oznacava element kom je event attached, dakle this koji koristimo u metodu _newWorkout ce ukazivati na form element. Zato ne treba pozivati kao this._newWorkout vec kao this._newWorkout.bind(this)

		inputType.addEventListener(
			'change',
			this._toggleElevationField //! Ovde unutar ovog _toggleElevationField metoda nigde ne koristimo this keyword, zato tu ne moramo da bajndujemp
		);
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
		this.#map = L.map('map').setView(coords, 13); //? ovo map('map'), tj ovo map pod navodnicima je ID nas u htmlu koji imamo gde treba da smestimo mapu

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
	}
	_showForm(mapE) {
		this.#mapEvent = mapE; //! kopirali smo mapE u mapvent, jer ovde u ovom scope bloku nam ne treba mapE, ali jbg, samo odavde imamo pristup njoj, pa smo definisali globalnu varijablu sa let mapEvent i ovde joj dodelili vrednost mapE.
		form.classList.remove('hidden');
		inputDistance.focus();
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
		console.log(workout, workout.type);

		//? Render workout on map as marker
		this.renderWorkoutMarker(workout);

		//? Render workout on list

		//? Hide form + clear input fields
		inputDistance.value =
			inputDuration.value =
			inputCadence.value =
			inputElevation.value =
				'';
	}
	renderWorkoutMarker(workout) {
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
			.setPopupContent('workout')
			.openPopup();
	}
}
const app = new App();
// app._getPosition();
