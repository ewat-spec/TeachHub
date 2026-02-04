export const initializeSecurityAgent = () => console.log("Security Agent Initialized");
export const createSanitizedHtmlObject = (html: string) => ({ __html: html });
export const reportSuspiciousActivity = (type: string, data: any) => console.warn("Suspicious Activity:", type, data);
