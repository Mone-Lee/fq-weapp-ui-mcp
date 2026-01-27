function getArgs(): string[] {
  return process.argv.slice(2);
}

function parseToken(): string {
  const args = getArgs();
  let token = "";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--token" && i + 1 < args.length) {
      token = args[i + 1] || "";
      break;
    } else if (args[i]?.startsWith("--token=")) {
      const splitValue = args[i]?.split("=")[1];
      token = splitValue || "";
      break;
    }
  }

  return token;
}


export { parseToken, getArgs };