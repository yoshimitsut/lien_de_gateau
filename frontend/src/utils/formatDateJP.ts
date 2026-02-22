export function formatDateJP(dateSpring:string | null) {
  if (!dateSpring) return ""; 
  const [year, month, day] = dateSpring.split("-");
  return `${year}年${month}月${day}日`;
}