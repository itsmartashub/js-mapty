'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

let map, mapEvent;

if (navigator.geolocation) {
	navigator.geolocation.getCurrentPosition(
		function (position) {
			//* ova prva callback f-ja za parametar ima position, tj mozemo ga nazvati kako hocemo
			const { latitude, longitude } = position.coords;
			// const { longitude } = position.coords;
			console.log(
				`https://www.google.com/maps/@${latitude},${longitude}`
			);

			const coords = [latitude, longitude];

			map = L.map('map').setView(coords, 13); //? ovo map('map'), tj ovo map pod navodnicima je ID nas u htmlu koji imamo gde treba da smestimo mapu

			L.tileLayer(
				'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
				// 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
				{
					attribution:
						'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
				}
			).addTo(map);

			//? Handling clicks on map
			map.on('click', function (mapE) {
				mapEvent = mapE; //! kopirali smo mapE u mapvent, jer ovde u ovom scope bloku nam ne treba mapE, ali jbg, samo odavde imamo pristup njoj, pa smo definisali globalnu varijablu sa let mapEvent i ovde joj dodelili vrednost mapE.
				form.classList.remove('hidden');
				inputDistance.focus();

				// console.log(mapEvent);
				// const { lat, lng } = mapEvent.latlng;

				// L.marker([lat, lng])
				// 	.addTo(map)
				// 	.bindPopup(
				// 		L.popup({
				// 			maxWidth: 250,
				// 			minWidth: 100,
				// 			autoClose: false,
				// 			closeOnClick: false,
				// 			className: 'running-popup',
				// 		})
				// 	)
				// 	.setPopupContent('Workout')
				// 	.openPopup();
			});
		},
		function () {
			alert("Coudn't get ur position");
		}
	); //! Ova getCurrentPosition() f-ja za input prima 2 callback f-je: jedna je kada browser uspesno dohvati koodrdinate trenutne pozicije korisnika, a druga je kada je error prilikom dohvatanja koordinata.
}

form.addEventListener('submit', function (e) {
	e.preventDefault();

	//? Clear input fields
	inputDistance.value =
		inputDuration.value =
		inputCadence.value =
		inputElevation.value =
			'';

	//? Display marker
	const { lat, lng } = mapEvent.latlng;

	L.marker([lat, lng])
		.addTo(map)
		.bindPopup(
			L.popup({
				maxWidth: 250,
				minWidth: 100,
				autoClose: false,
				closeOnClick: false,
				className: 'running-popup',
			})
		)
		.setPopupContent('Workout')
		.openPopup();
});

inputType.addEventListener('change', function () {
	inputElevation.closest('.form__row').classList.toggle('form__row--hidden'); //! closest() je kao inverse metod od querySelector, tj on selektuje parente, dok querySelector selektuje child-ove.
	inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
});
