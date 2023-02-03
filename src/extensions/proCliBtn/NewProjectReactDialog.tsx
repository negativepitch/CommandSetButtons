import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Dialog, BaseDialog, IDialogConfiguration } from '@microsoft/sp-dialog';
import { PrimaryButton, DefaultButton } from '@fluentui/react';
import { DialogType, DialogFooter, DialogContent } from '@fluentui/react';
import { TextField } from '@fluentui/react';
import { Spinner, SpinnerSize } from '@fluentui/react/lib/Spinner';
import { Label } from '@fluentui/react/lib/Label';
import { SPHttpClient, SPHttpClientResponse, ISPHttpClientOptions } from '@microsoft/sp-http';


interface IDialogContentProps {
    message: string;
    close: () => void;
    submit: (projectName:string) => void;
}

interface IDialogState {
    isValid: boolean,
    isLoading: boolean,
    projectName: string,
    isDuplicate: boolean
}

interface ISPFolderExists {
  value: boolean
}


class CustomDialogContent extends React.Component<IDialogContentProps, IDialogState> {
    private _characterLimit:number;
    constructor(props: IDialogContentProps | Readonly<IDialogContentProps>,state:IDialogState) {
      super(props);
      this._characterLimit = 255;
      this.state = {
        isValid: false,
        isLoading: false,
        projectName: '',
        isDuplicate: false
      }
    }
  
    public render(): JSX.Element {
      return <DialogContent
      title='New Project'
      type={ DialogType.largeHeader }
      onDismiss={this.props.close}
      showCloseButton={false}
      >
        { 
            this.state.isLoading ? 
            <>
            <Label>Creating project...</Label>
            <Spinner size={SpinnerSize.large} />
            </>
            : 
            <TextField label="What is your project's name?" onChange={ (ev:React.FormEvent<HTMLInputElement>,val?:string) => this.inputOnChange(ev,val) } value={ this.state.projectName } required /> 
        }
        <DialogFooter>
            <DefaultButton text='Cancel' title='Cancel' onClick={this.props.close} />
            <PrimaryButton text='Create' title='Create' disabled={ !this.state.isValid || this.state.isLoading } onClick={ () => this.submitClick() } />
        </DialogFooter>
      </DialogContent>;
    }

    private inputOnChange(ev:React.FormEvent<HTMLInputElement>,val?:string) {
        const re = new RegExp(/[\"\*\:\<\>\?\/\\\\\|]/gm);
        let projectName = val ? val.substring(0,this._characterLimit) : '';
        projectName = projectName.replace(re,'');
        this.setState({
            isValid: !!(val.length >= 1),
            isLoading: false,
            projectName: projectName,
            isDuplicate: false
        });
    }

    private submitClick() {
        this.setState((prevState) => {
          return({
            ...prevState,
            isLoading: true
          });
        },
        () => {
          this.props.submit(this.state.projectName);
        });
        
    }
}

export default class NewProjectDialog extends BaseDialog {
    public message: string;
    public context: any;
  
    public render(): void {
        ReactDOM.render(<CustomDialogContent
            close={ this.close }
            message={ this.message }
            submit={ this._submit }
            />, this.domElement);
    }
  
    public getConfig(): IDialogConfiguration {
      return { isBlocking: false };
    }
  
    protected onAfterClose(): void {
      super.onAfterClose();
  
      // Clean up the element for the next dialog
      ReactDOM.unmountComponentAtNode(this.domElement);
    }

    private _submit = async (val:string) => {
        const newFolderName = val.trim();
        const tenantUrl = this.context.pageContext.web.absoluteUrl.replace(this.context.pageContext.web.serverRelativeUrl,'')
        const newFolderUrl =  tenantUrl + this.context.listView.folderInfo.folderPath + "/" + newFolderName;
        // 1. Check For Duplicate Name
        this.isFolderDuplicate(newFolderName,this.context.listView.folderInfo.folderPath).then((response) => {
          const isDuplicate = response.value
          console.log("isDuplicate: ", isDuplicate);
          if (isDuplicate) {
            Dialog.alert(`A folder with the name '${ newFolderName }' already exists`);
            this.close();
          } else {
            this.createFolderCopy(newFolderName).then((success:boolean) => {
              console.log("createFolderCopy: ", success);
              Dialog.alert(`The project '${ newFolderName }' has been created!`).then(() => {
                // 3. Refresh library
                location.href = newFolderUrl;
              });
              this.close();
            })
          }
        })

    }

    private isFolderDuplicate(foldername:string,path:string): Promise<ISPFolderExists> {
      console.log("foldername: ", foldername, "path",path);
      const endpoint = `${this.context.pageContext.web.absoluteUrl}/_api/web/GetFolderByServerRelativeUrl('${path}/${foldername}')/Exists`
      console.log(endpoint);
      return this.context.spHttpClient.get(endpoint,SPHttpClient.configurations.v1)
        .then((response: SPHttpClientResponse) => {
          return response.json();
        })
        .catch(() => {});
      
    }

    private createFolderCopy(folderName:string): Promise<boolean> {
      const rootPath = this.context.pageContext.web.absoluteUrl.replace(this.context.pageContext.web.serverRelativeUrl,"");
      const listPath = rootPath + this.context.pageContext.list.serverRelativeUrl + "/__ProjectFolderTemplate";
      const destPath = rootPath + this.context.listView.folderInfo.folderPath + "/" + folderName;
      const spOpts: ISPHttpClientOptions = {
        body: `{
            "srcPath": {
                "DecodedUrl": "${listPath}"
            },
            "destPath": {
                "DecodedUrl": "${destPath}"
            },
            "options": {
                "ResetAuthorAndCreatedOnCopy": true,
                "ShouldBypassSharedLocks": true
            }
        }
        `,
        headers: {
          'Content-Type': 'application/json;odata=verbose',
          'Accept': 'application/json;odata=verbose'
        }
      };
  
      return this.context.spHttpClient
      .post(`${this.context.pageContext.web.absoluteUrl}/_api/SP.MoveCopyUtil.CopyFolderByPath()`,SPHttpClient.configurations.v1,spOpts)
      .then(() => {
        return true;
      }).catch((err:any) => {
        console.log(err);
        return false;
      })
    }

  }