export const env = {
  port: Number(process.env.PORT ?? 4000),
  socrataUsername: process.env.SOCRATA_USERNAME,
  socrataPassword: process.env.SOCRATA_PASSWORD,
  socrataAppToken: process.env.SOCRATA_APP_TOKEN_MTC,
  vmtDataKey: process.env.VMT_DATA_KEY,
};
