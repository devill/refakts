// Sample help outputs for testing documentation parsing

export const FULL_CLI_HELP = `Usage: refakts [options] [command]

RefakTS lets AI agents make precise code changes without rewriting entire files

Options:
  -V, --version   display version number
  -h, --help      display help for command

Commands:
  extract-variable [options] <target>  Extract expression into a variable
  inline-variable <target>             Replace variable usage with its value
  rename [options] <target>            Rename a variable and all its references
  select [options] <target>            Find code elements and return their locations with content preview
  help [command]                       display help for command
`;

export const MINIMAL_CLI_HELP = `Usage: refakts [command]

Commands:
  select <target>    Find code elements
  help [command]     display help for command
`;

export const EMPTY_COMMANDS_HELP = `Usage: refakts [options]

Options:
  -h, --help      display help for command
`;

export const MALFORMED_HELP = `Some random text
No Commands section here
Just garbage output
`;

export const MULTILINE_DESCRIPTION_HELP = `Usage: refakts [command]

Commands:
  extract-variable [options] <target>  Extract expression into a variable
                                       with support for complex expressions
  select <target>                      Find code elements and return their 
                                       locations with content preview
  help [command]                       display help for command
`;