export const getDates = (startDate, endDate) => {
	let dateArray = [];
	let currentDate = startDate;
	while (currentDate <= endDate) {
		dateArray.push(formatDate(new Date(currentDate)));
		currentDate.setDate(currentDate.getDate() + 1);
	}
	return dateArray;
};

export const formatDate = (date) => {
	return date.toISOString().slice(0, 10);
};
