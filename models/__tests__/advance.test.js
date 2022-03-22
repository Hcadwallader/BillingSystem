import Advance from '../advance.js';
import Charge from '../charge.js';
import addDay from '../../utilities/dateHelper.js';
test('Advance calculates repayment correct v1', () => {
	let advance = new Advance({
		id: 1,
		mandate_id: 2,
		repayment_percentage: 10,
		fee: 1000,
		total_advanced: 9000,
		repayment_start_date: '2022-02-01',
	});
	let date = new Date('2022-02-02');
	let revenue = 10000;
	expect(advance.calculateCharge(revenue, date)).toEqual(
		new Charge(date, 1000, 2, 1)
	);
});
test('Advance calculates repayment correct v2', () => {
	let advance = new Advance({
		id: 1,
		mandate_id: 2,
		repayment_percentage: 5,
		fee: 6000,
		total_advanced: 60000,
		repayment_start_date: '2022-02-01',
	});
	let date = new Date('2022-02-02');
	let revenue = 16000;
	expect(advance.calculateCharge(revenue, date)).toEqual(
		new Charge(date, 800, 2, 1)
	);
});
test('Marks a completed payment correctly', () => {
	let advance = new Advance({
		id: 1,
		mandate_id: 4,
		repayment_percentage: 10,
		fee: 100,
		total_advanced: 900,
		repayment_start_date: '2022-02-01',
	});
	let date = new Date('2022-02-02');
	let revenue = 10000;
	expect(advance.calculateCharge(revenue, date)).toEqual(
		new Charge(date, 1000, 4, 1, true)
	);
});
test('Reduces payment if calculated over required payment', () => {
	let advance = new Advance({
		id: 1,
		mandate_id: 2,
		repayment_percentage: 10,
		fee: 100,
		total_advanced: 900,
		repayment_start_date: '2022-02-01',
	});
	let date = new Date('2022-02-02');
	let revenue = 100000;
	expect(advance.calculateCharge(revenue, date)).toEqual(
		new Charge(date, 1000, 2, 1, true)
	);
});
test('Doesnt take payment before repayment start date', () => {
	let advance = new Advance({
		id: 1,
		mandate_id: 2,
		repayment_percentage: 10,
		fee: 100,
		total_advanced: 900,
		repayment_start_date: '2022-02-05',
	});
	let date = new Date('2022-02-01');
	let revenue = 100000;
	expect(advance.calculateCharge(revenue, date)).toEqual(null);
});
test('Doesnt take payment if its already been repaid', () => {
	let advance = new Advance({
		id: 1,
		mandate_id: 2,
		repayment_percentage: 10,
		fee: 100,
		total_advanced: 900,
		repayment_start_date: '2022-02-05',
	});
	let date = new Date('2022-02-01');
	let revenue = 100000;
	// first payment
	advance.calculateCharge(revenue, date);
	// second one shouldn't be taken
	expect(advance.calculateCharge(revenue, date)).toEqual(null);
});
test('Amount to be paid back over 10000', () => {
	let advance = new Advance({
		id: 1,
		mandate_id: 2,
		repayment_percentage: 10,
		fee: 4000,
		total_advanced: 40000,
		repayment_start_date: '2022-02-05',
	});
	const date = new Date('2022-02-06');
	const revenue = 110000;

	expect(advance.calculateCharge(revenue, date)).toEqual(
		new Charge(date, 10000, 2, 1)
	);
	const revenueSecondDay = 10000;
	const secondDay = new Date('2022-02-07');
	expect(advance.calculateCharge(revenueSecondDay, secondDay)).toEqual(
		new Charge(secondDay, 2000, 2, 1)
	);

	const revenueThirdDay = 10000;
	const thirdDay = new Date('2022-02-07');
	expect(advance.calculateCharge(revenueThirdDay, thirdDay)).toEqual(
		new Charge(thirdDay, 1000, 2, 1)
	);
});
