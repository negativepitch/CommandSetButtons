import { Log } from '@microsoft/sp-core-library';
import {
  BaseListViewCommandSet,
  Command,
  IListViewCommandSetExecuteEventParameters,
  ListViewStateChangedEventArgs
} from '@microsoft/sp-listview-extensibility';

import NewProjectDialog from './NewProjectReactDialog';
import NewClientDialog from './NewClientReactDialog';

/**
 * If your command set uses the ClientSideComponentProperties JSON input,
 * it will be deserialized into the BaseExtension.properties object.
 * You can define an interface to describe it.
 */
export interface IProCliBtnCommandSetProperties {
  // This is an example; replace with your own properties
  sampleTextOne: string;
  sampleTextTwo: string;
}

const LOG_SOURCE: string = 'ProCliBtnCommandSet';

export default class ProCliBtnCommandSet extends BaseListViewCommandSet<IProCliBtnCommandSetProperties> {
  public onInit(): Promise<void> {
    Log.info(LOG_SOURCE, 'Initialized ProCliBtnCommandSet');

    console.log(":: AMB SPFX Extension - ProCliBtnCommandSet V7");
    console.log(this.context);
    // initial state of the command's visibility
    const compareOneCommand: Command = this.tryGetCommand('COMMAND_1');
    const compareTwoCommand: Command = this.tryGetCommand('COMMAND_2');
    compareOneCommand.visible = this.context.pageContext.list.title == 'Client & Partner Data';
    compareTwoCommand.visible = this.context.pageContext.list.title == 'Client & Partner Data';

    console.log(":: Extension visible - ", this.context.pageContext.list.title == 'Client & Partner Data'," ::")

    this.context.listView.listViewStateChangedEvent.add(this, this._onListViewStateChanged);

    return Promise.resolve();
  }

  public onExecute(event: IListViewCommandSetExecuteEventParameters): void {
    switch (event.itemId) {
      case 'COMMAND_1':
        const projectDialog: NewProjectDialog = new NewProjectDialog();
        projectDialog.message = "What is your project's name?";
        projectDialog.context = this.context;
        projectDialog.show();
        break;
      case 'COMMAND_2':
        const clientDialog: NewClientDialog = new NewClientDialog();
        clientDialog.message = "What is your client's name?";
        clientDialog.context = this.context;
        clientDialog.show();
        break;
      default:
        throw new Error('Unknown command');
    }
  }

  private _onListViewStateChanged = (args: ListViewStateChangedEventArgs): void => {
    Log.info(LOG_SOURCE, 'List view state changed');

    if (this.context.pageContext.list.title == 'Client & Partner Data') {
      const compareOneCommand: Command = this.tryGetCommand('COMMAND_1');
      const compareTwoCommand: Command = this.tryGetCommand('COMMAND_2');
      if (compareOneCommand) {
        // This command should be hidden unless exactly one row is selected.
        // compareOneCommand.visible = this.context.listView.selectedRows?.length === 0;
        compareOneCommand.visible = true;
      }
      if (compareTwoCommand) {
        // This command should be hidden unless exactly one row is selected.
        // compareTwoCommand.visible = this.context.listView.selectedRows?.length === 0;
        compareTwoCommand.visible = true;
      }

      // TODO: Add your logic here
      this.raiseOnChange();
    }
      // You should call this.raiseOnChage() to update the command bar
      this.raiseOnChange();
  }
}
