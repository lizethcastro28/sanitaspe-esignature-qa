## README.md

### Descripción del Proyecto
Este proyecto contiene el código de la aplicación Sanitaspe-eSignature.

### Configuración del Entorno
#### Requisitos Previos
* **Cuenta de AWS:** Con los siguientes permisos:
  * AmplifyBackendDeployFullAccess
  * AdministratorAccess-Amplify
  * AmazonRekognitionFullAccess
  * Permisos de IAM adicionales:
    ```json
    {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Action": [
            "ssm:PutParameter",
            "ecr:PutLifecyclePolicy",
            "ssm:DeleteParameter",
            "ssm:GetParameters",
            "ecr:BatchGetRepositoryScanningConfiguration",
            "ssm:GetParameter",
            "ecr:DeleteRepository",
            "ssm:DeleteParameters",
            "ecr:GetRepositoryPolicy",
            "ecr:SetRepositoryPolicy",
            "ssm:PutParameter"
          ],
          "Resource": "*"
        }
      ]
    }
    ```
* **Repositorio de GitHub:** Un duplicado del repositorio https://github.com/lizethcastro28/sanitaspe-esignature-qa

### Implementación en Amplify
1. **Crear una nueva aplicación en Amplify:**
   * En la consola de AWS, ve al servicio de Amplify.
   * Crea una nueva aplicación y sigue el asistente.
2. **Conectar con el repositorio de GitHub:**
   * Selecciona GitHub como proveedor de código fuente.
   * Autoriza a Amplify para acceder al repositorio duplicado.
   * Selecciona el repositorio y la rama `main` (o la rama que deseas desplegar).
3. **Configurar la aplicación:**
   * Sigue las instrucciones del asistente para configurar la aplicación.
   * **Importante:** Asegúrate de que los permisos de IAM estén configurados correctamente para que Amplify pueda acceder a los recursos necesarios.
4. **Implementar:**
   * Haz clic en "Save and Deploy" para iniciar la implementación.

### Ver la Aplicación Implementada
Una vez que la implementación se haya completado, podrás acceder a tu aplicación en Amplify -> MyApp -> Domain.

### Consideraciones Adicionales
* **Errores:** Si encuentras algún error durante el proceso, revisa la pila de CloudFormation en AWS para obtener más detalles.
* **Personalización:** Puedes personalizar este README agregando más detalles sobre tu proyecto, como tecnologías utilizadas, configuración específica, etc.

**Este README te proporciona una guía básica para implementar tu aplicación en AWS Amplify. Asegúrate de adaptar los pasos a las características específicas de tu proyecto.**

**¿Necesitas más detalles sobre alguna parte del proceso?**
## Deploying to AWS

For detailed instructions on deploying your application, refer to the [deployment section](https://docs.amplify.aws/react/start/quickstart/#deploy-a-fullstack-app-to-aws) of our documentation.

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.