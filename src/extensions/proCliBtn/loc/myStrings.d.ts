declare interface IProCliBtnCommandSetStrings {
  Command1: string;
  Command2: string;
}

declare module 'ProCliBtnCommandSetStrings' {
  const strings: IProCliBtnCommandSetStrings;
  export = strings;
}
