export type ClientConfigurations = {
  formatter: {abbreviateAssignments: boolean}
  'cli-path': string
  language: "Spanish"|"English"|"Based on Local Environment",
  maxNumberOfProblems: number
  trace: {server: "off" |  "messages" | "verbose"}
  openDynamicDiagramOnRepl: boolean
  openInternalDynamicDiagram: boolean
  dynamicDiagramDarkMode: boolean
}