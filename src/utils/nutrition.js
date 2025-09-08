export const calcBMR = ({ gender, weight, height, age }) => {
    // Mifflin-St Jeor
    const s = gender === 'male' ? 5 : -161
    return Math.round(10 * Number(weight) + 6.25 * Number(height) - 5 * Number(age) + s)
  }
  
  export const activityFactor = (lvl) => {
    switch (lvl) {
      case 'sedentary': return 1.2
      case 'moderate': return 1.55
      case 'active': return 1.725
      default: return 1.2
    }
  }
  
  export const calcTDEE = (bmr, lvl) => Math.round(bmr * activityFactor(lvl))
  
  export const macrosToKcal = ({ protein = 0, fat = 0, carb = 0 }) =>
    Math.round(Number(protein) * 4 + Number(fat) * 9 + Number(carb) * 4)