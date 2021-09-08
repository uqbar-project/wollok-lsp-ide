#
# Links Wollok TS project into this one, using yalc. Anytime you need to update the dependency project,
# simply execute
#
# $ yalc push
#
# on wollok-ts directory.
#
# Usage:
# linkWollokTs.sh folder 
# linkWollokTs.sh        # default, uses ../wollok-ts as Wollok TS folder
# linkWollokTs.sh help   # for details
#
# Once you're set, you should replace the dependency in current package.json

ERROR_COLOR='\033[1;31m'
NO_COLOR='\033[0m'

if [ $1 == "help" ];
then
  COMMAND_COLOR='\033[0;34m'
  ARG_COLOR='\033[0;33m'

  echo -e "${COMMAND_COLOR}linkWollokTs:${NO_COLOR} links a local Wollok TS environment into this project."
  echo -e "  ${ARG_COLOR}Optional single argument${NO_COLOR}: the folder where Wollok TS is located."
  echo "  Assuming ../wollok-ts if not present."
  exit 0
fi

if [ -z "$1" ];
then
  WOLLOK_TS_DIR=../wollok-ts
else
  WOLLOK_TS_DIR=$1
fi

if [ ! -f "$WOLLOK_TS_DIR/package.json" ];
then
  echo -e "${ERROR_COLOR}No package.json found in $WOLLOK_TS_DIR folder.${NO_COLOR}"
  exit 1
fi

CURRENT_DIR=$PWD

# Install yalc cross dependency management
npm install -g yalc

# Publish wollok-ts dependency
cd $WOLLOK_TS_DIR
echo "Moving to $(pwd)"
yalc publish

# Go back to our project
cd $CURRENT_DIR
echo "Moving to $(pwd)"
yalc add wollok-ts
npm i
