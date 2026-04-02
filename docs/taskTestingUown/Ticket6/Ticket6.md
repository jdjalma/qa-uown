-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/ams/-/issues/6

UOWN | AMS | Add Permissions: Unlock Users & Edit Panels

Synopsis:
We need to create a permission that allows a user to be unlocked manually, even without completing the previous step (changing their password), 
since not all users will have access to their email. Therefore, certain users should have this permission as a precaution.

Business Objective:
Improve user experience and reduce the need for manual intervention from the support team by allowing locked users to unlock themselves through the password reset flow. 
This change will also contribute to a more efficient operation by reducing the workload on UOWN agents.

Features and Requirements:
    Create a permission to unlock manually: (e.g: unlock_user)
    Ensure the flow is secure and the unlock only occurs after a valid password reset.

Permissions Added:
- ams unlock user [modify]
- ams edit user panel [modify]
These permissions were added to both Origination and Servicing.
Since they share the same target resource, adding or removing them in one area affects both.
Manager and Admin roles should have these permissions by default.

Test Scenarios:
Unlock Button Visibility & Functionality:
- User with ams unlock user permission should see and use the Unlock button.
- User without ams unlock user permission should not see the Unlock button.

Edit User Panels
- User with ams edit user panel permission should be able to edit panels.
- User without ams edit user panel permission should not have panel editing capabilities.

-----



-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Alterações dev:
Visão geral 16
Commits 
61
Pipelines 
35
Alterações 9
Abrir os tópicos 12
Comparar
e
 9 arquivos
+
1208
−
959
Arquivos
9
Search (e.g. *.vue) (F)

src/main/java/co
‎m/uownleasing/ams‎

enume
‎ration‎

SystemN
‎ame.java‎
+1 -0

envir
‎onment‎

Environment
‎Service.java‎
+10 -21

Uown
‎.java‎
+1085 -886

ser
‎vice‎

Authorizatio
‎nService.java‎
+79 -29

SubSystemS
‎ervice.java‎
+1 -0

UserServ
‎ice.java‎
+3 -3

web/se
‎curity‎

AuthorizationAccess
‎DecisionManager.java‎
+5 -5

LoginHan
‎dler.java‎
+3 -3

UserAuthenticat
‎ionProvider.java‎
+21 -12

 src/main/java/com/uownleasing/ams/web/security/AuthorizationAccessDecisionManager.java 
+
5
−
5

Visualizado
@@ -136,11 +136,11 @@ public class AuthorizationAccessDecisionManager implements AccessDecisionManager
        if (objectKeys.size() >= 1) {
            // recur on the next object key
            checkArg(checkType,
                    ((LinkedHashMap) item).get(objectKeys.get(0)),
                    itemPath + "/" + objectKeys.get(0),
                    objectKeys.subList(1, objectKeys.size()),
                    authentication,
                    request);
                ((LinkedHashMap) item).get(objectKeys.get(0)),
                itemPath + "/" + objectKeys.get(0),
                objectKeys.subList(1, objectKeys.size()),
                authentication,
                request);
        } else {

            if (checkType == SecurityArgCheckType.KEYS) {
 src/main/java/com/uownleasing/ams/web/security/LoginHandler.java 
+
3
−
3

Visualizado
@@ -88,11 +88,11 @@ public class LoginHandler implements AuthenticationSuccessHandler, Authenticatio

        //start recurring on first level children
        for(PermissionGraphNode n: node.getChildren().values()) {
            buildPermissionMapRecur(n, map);
            buildJsonFromGraphNode(n, map);
        }
    }

    private void buildPermissionMapRecur(PermissionGraphNode node, ObjectNode map) {
    private void buildJsonFromGraphNode(PermissionGraphNode node, ObjectNode map) {
        List<ObjectNode> parentJsonNodes = getParentNode(node, map);

        for(ObjectNode parentNode: parentJsonNodes) {
@@ -104,7 +104,7 @@ public class LoginHandler implements AuthenticationSuccessHandler, Authenticatio
            ObjectNode jsonNode = parentNode.putObject(node.getPathName());

            for (PermissionGraphNode n : node.getChildren().values()) {
                buildPermissionMapRecur(n, jsonNode);
                buildJsonFromGraphNode(n, jsonNode);
            }
        }
    }
 src/main/java/com/uownleasing/ams/web/security/UserAuthenticationProvider.java 
+
21
−
12

Visualizado
@@ -16,6 +16,8 @@ import org.springframework.security.core.AuthenticationException;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import javax.servlet.http.HttpServletRequest;
import java.util.Objects;
@@ -35,35 +37,42 @@ public class UserAuthenticationProvider implements AuthenticationProvider {
    @Autowired
    private PermissionGraphBuilder permissionGraphBuilder;

    private static final Logger LOG = LogManager.getLogger(UserAuthenticationProvider.class);

    @Override
    @Transactional(noRollbackFor = {BadCredentialsException.class})
    public Authentication authenticate(Authentication authentication) throws AuthenticationException {

        //determine subsystem by header
        HttpServletRequest request = ((ServletRequestAttributes) Objects.requireNonNull(RequestContextHolder.getRequestAttributes())).getRequest();
        HttpServletRequest request = ((ServletRequestAttributes) Objects
            .requireNonNull(RequestContextHolder.getRequestAttributes()))
            .getRequest();

        String subSystemName = request.getHeader("sub-system");
        if(subSystemName == null || subSystemName.isEmpty()) {
        if (subSystemName == null || subSystemName.isEmpty()) {
            throw new UnknownSubSystemException("Sub system is empty or null");
        }

        SubSystem sys = subSystemService.getSubSystemByName(subSystemName).orElseThrow(() -> new UnknownSubSystemException("Unknown sub system: " + subSystemName));
        SubSystem currentSubSystem = subSystemService.getSubSystemByName(subSystemName)
            .orElseThrow(() -> new UnknownSubSystemException("Unknown sub system: " + subSystemName));

        User user = authenticationService.login((String) authentication.getPrincipal(), (String) authentication.getCredentials());
        User user = authenticationService.login(
            (String) authentication.getPrincipal(),
            (String) authentication.getCredentials()
        );

        if(user.getStatus() == Status.Inactive) {
        if (user.getStatus() == Status.Inactive) {
            throw new DisabledException("Account disabled");
        }

        // login doesnt need authorities as request terminates after authentication success/failure
        UserAuthenticationToken authToken = new UserAuthenticationToken(user, null);
//        authToken.setLoginToken(loginInfo.getFirst());

        PermissionDetails details = new PermissionDetails();
        details.setPermissionSet(authorizationService.getUserPermissions(user, sys));
        details.setPermissionGraph(permissionGraphBuilder.buildGraph(user, details.getPermissionSet()));
        PermissionDetails details = authorizationService.getPermissionDetails(user);
        LOG.debug("[UserAuthenticationProvider] permissionGraph root: {}", details.getPermissionGraph().toString());
        LOG.debug("[UserAuthenticationProvider] permissionSet size: {}", details.getPermissionSet() == null ? -1 : details.getPermissionSet().size());

        authToken.setDetails(details);
        authToken.setSubSystem(sys);
        authToken.setSubSystem(currentSubSystem);

        return authToken;
    }

Visão geral 
0
Commits 
5
Pipelines 
1
Alterações 8
Comparar
e
 8 arquivos
+
186
−
143
Arquivos
8
Search (e.g. *.vue) (F)

libs/co
‎mmon-ui‎

src/ams/components/edi
‎t-panels/user-specific‎

gr
‎oup‎

inde
‎x.tsx‎
+14 -4

merc
‎hant‎

inde
‎x.tsx‎
+17 -15

pass
‎word‎

inde
‎x.tsx‎
+23 -21

permi
‎ssion‎

inde
‎x.tsx‎
+19 -8

ro
‎le‎

inde
‎x.tsx‎
+20 -11

us
‎er‎

inde
‎x.tsx‎
+57 -43

user
‎name‎

inde
‎x.tsx‎
+35 -40

packag
‎e.json‎
+1 -1

 libs/common-ui/src/ams/components/edit-panels/user-specific/user/index.tsx 
+
57
−
43

Visualizado
import { Col, Form, Row } from 'reactstrap';
import React, { useEffect, useState } from 'react';
import { useState } from 'react';
import { CollapsableEditLayout, InputField } from 'src';
import { useFormik } from 'formik';
import * as Yup from 'yup';
@@ -11,10 +11,10 @@ interface EditUserProps {
  updateUserProfile: (user: User) => Promise<number>;
  getUser: (username: string) => Promise<number>;
  unlockUser?: (username: string) => Promise<ResponseType>;
  hasUnlockUserPermissionOnly?: boolean;
  hasEditPermission: boolean;
  readOnlyCategory?: {
    [key: string]: boolean
  }
    [key: string]: boolean;
  };
}

export const EditUserPanel = (props: EditUserProps) => {
@@ -23,19 +23,11 @@ export const EditUserPanel = (props: EditUserProps) => {
    getUser,
    updateUserProfile,
    unlockUser,
    hasUnlockUserPermissionOnly,
    readOnlyCategory
    hasEditPermission,
    readOnlyCategory,
  } = props;
  const { loginLockout = false } = user || {};

  const [isWriteMode, setIsWriteMode] = useState(false);
  const [isAccountLocked, setIsAccountLocked] = useState<boolean>(
    loginLockout || false
  );

  useEffect(() => {
    setIsAccountLocked(loginLockout);
  }, [loginLockout]);

  const emailAddressInitial = user?.emailAddress || '';

@@ -54,8 +46,10 @@ export const EditUserPanel = (props: EditUserProps) => {
    validationSchema: Yup.object({
      firstName: Yup.string().required('First Name is required.'),
      email: Yup.string().email('Invalid email'),
      phoneNumber: Yup.string()
      .matches(/^(\+\d{1,2}\s)?\(\d{3}\)[\s ]\d{3}[\s.-]\d{4}$/, 'Invalid phone number'),
      phoneNumber: Yup.string().matches(
        /^(\+\d{1,2}\s)?\(\d{3}\)[\s ]\d{3}[\s.-]\d{4}$/,
        'Invalid phone number'
      ),
    }),
    onSubmit: async (values) => {
      const {
@@ -68,31 +62,28 @@ export const EditUserPanel = (props: EditUserProps) => {
        unlockAccount,
      } = values;

      if (hasUnlockUserPermissionOnly && unlockUser) {
        if (user?.userName) {
          const response = await unlockUser(user?.userName);
          const { status, message } = response;
          if (status === 200) {
            await getUser(user?.userName);
            showToast('success', 'Successfully unlocked user account.');
            setIsWriteMode(false);
            formik?.resetForm();
          } else {
            showToast(
              'error',
              message ||
                'Unable to unlock user account. Please try again later.'
            );
          }
      if (hasEditPermission && unlockUser && user?.userName) {
        const response = await unlockUser(user?.userName);
        const { status, message } = response;
        if (status === 200) {
          await getUser(user?.userName);
          showToast('success', 'Successfully unlocked user account.');
          setIsWriteMode(false);
          formik?.resetForm();
        } else {
          showToast(
            'error',
            message || 'Unable to unlock user account. Please try again later.'
          );
        }
      } else {
        const updateUserProfileRequest: User = {
          firstName: firstName,
          lastName: lastName,
          phoneNumber: phoneNumber,
          firstName,
          lastName,
          phoneNumber,
          userName: username.trim(),
          status: active ? 'Active' : 'Inactive',
          unlockAccount: unlockAccount,
          unlockAccount,
        };
        if (email && email !== emailAddressInitial) {
          updateUserProfileRequest.emailAddress = email.trim();
@@ -115,6 +106,7 @@ export const EditUserPanel = (props: EditUserProps) => {
  const submitFormik = () => {
    formik.handleSubmit();
  };

  const handleCancel = () => {
    formik?.resetForm();
    setIsWriteMode(false);
@@ -125,7 +117,7 @@ export const EditUserPanel = (props: EditUserProps) => {
      title="Edit User Profile"
      isWriteMode={isWriteMode}
      setIsWriteMode={setIsWriteMode}
      isEditable={true}
      isEditable={hasEditPermission}
      handleSubmit={submitFormik}
      handleCancel={handleCancel}
    >
@@ -140,7 +132,11 @@ export const EditUserPanel = (props: EditUserProps) => {
                name="firstName"
                type="name"
                placeholder="First Name"
                isReadOnly={!isWriteMode || hasUnlockUserPermissionOnly || readOnlyCategory?.firstName}
                isReadOnly={
                  !isWriteMode ||
                  !hasEditPermission ||
                  readOnlyCategory?.firstName
                }
              />
            </Col>

@@ -152,7 +148,11 @@ export const EditUserPanel = (props: EditUserProps) => {
                name="lastName"
                type="name"
                placeholder="Last Name"
                isReadOnly={!isWriteMode || hasUnlockUserPermissionOnly || readOnlyCategory?.lastName}
                isReadOnly={
                  !isWriteMode ||
                  !hasEditPermission ||
                  readOnlyCategory?.lastName
                }
              />
            </Col>
          </Row>
@@ -165,7 +165,9 @@ export const EditUserPanel = (props: EditUserProps) => {
                label="Email"
                name="email"
                placeholder="Email"
                isReadOnly={!isWriteMode || hasUnlockUserPermissionOnly || readOnlyCategory?.email}
                isReadOnly={
                  !isWriteMode || !hasEditPermission || readOnlyCategory?.email
                }
                type="email"
                isNoSpaceAllowed={true}
              />
@@ -178,19 +180,26 @@ export const EditUserPanel = (props: EditUserProps) => {
                value={formik.values.phoneNumber}
                name="phoneNumber"
                placeholder="Phone Number"
                isReadOnly={!isWriteMode || hasUnlockUserPermissionOnly || readOnlyCategory?.phoneNumber}
                isReadOnly={
                  !isWriteMode ||
                  !hasEditPermission ||
                  readOnlyCategory?.phoneNumber
                }
                type="phone-number"
                maxLength={14}
              />
            </Col>
          </Row>

          <Row className="mb-4">
            <Col xs={6}>
              <FlipSwitch
                label="Active"
                checked={formik?.values?.active}
                name="active"
                isWriteMode={isWriteMode && !hasUnlockUserPermissionOnly || readOnlyCategory?.active}
                isWriteMode={
                  isWriteMode && hasEditPermission && !readOnlyCategory?.active
                }
                onChange={(checked: boolean) => {
                  formik?.setFieldValue('active', checked);
                }}
@@ -202,7 +211,12 @@ export const EditUserPanel = (props: EditUserProps) => {
                label="Account Locked"
                checked={formik?.values?.accountLocked}
                name="unlockAccount"
                isWriteMode={isWriteMode && formik?.values?.accountLocked || readOnlyCategory?.unlockAccount}
                isWriteMode={
                  isWriteMode &&
                  hasEditPermission &&
                  formik?.values?.accountLocked &&
                  !readOnlyCategory?.unlockAccount
                }
                onChange={(checked: boolean) => {
                  formik?.setFieldValue('unlockAccount', !checked);
                }}
 libs/common-ui/src/ams/components/edit-panels/user-specific/username/index.tsx 
+
35
−
40

Visualizado
@@ -6,46 +6,21 @@ import { useFormik } from 'formik';
import * as Yup from 'yup';
import { User, UpdateUsernameRequest, ResponseType } from 'src';

interface EditUsernameProps {
interface EditUsernamePanelProps {
  user: User;
  checkUsername: (newUsername: string) => Promise<boolean>;
  updateUsername: (
    updateUsernameRequest: UpdateUsernameRequest
  ) => Promise<ResponseType>;
  hasUnlockUserPermissionOnly: boolean;
  hasEditPermission: boolean;
}

export const EditUsernamePanel = (props: EditUsernameProps) => {
  const { user, checkUsername, updateUsername, hasUnlockUserPermissionOnly } =
    props;
export const EditUsernamePanel = (props: EditUsernamePanelProps) => {
  const { user, checkUsername, updateUsername, hasEditPermission } = props;
  const [isWriteMode, setIsWriteMode] = useState(false);

  useEffect(() => {
    formik.setValues({
      username: user?.userName || '',
      newUsername: '',
    });
  }, [user]);

  const changeUsername = async (username: string, newUsername: string) => {
    const updateUsernameRequest = {
      oldUsername: username,
      newUsername: newUsername,
    };
    const response = await updateUsername(updateUsernameRequest);
    if (response?.status === 200) {
      showToast('success', 'Successfully updated username.');
      setIsWriteMode(false);
    } else {
      showToast(
        'error',
        response?.message ||
          'Unable to update username. Please try again later.'
      );
    }
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      username: user?.userName || '',
      newUsername: '',
@@ -58,27 +33,47 @@ export const EditUsernamePanel = (props: EditUsernameProps) => {

      const isUsernameAvailable = await checkUsername(newUsername);
      if (isUsernameAvailable) {
        changeUsername(username, newUsername);
        setIsWriteMode(false);
        actions.resetForm({
          values: {
            username: newUsername,
            newUsername: '',
          },
        });
        const updateUsernameRequest: UpdateUsernameRequest = {
          oldUsername: username,
          newUsername,
        };
        const response = await updateUsername(updateUsernameRequest);

        if (response?.status === 200) {
          showToast('success', 'Successfully updated username.');
          setIsWriteMode(false);
          actions.resetForm({
            values: {
              username: newUsername,
              newUsername: '',
            },
          });
        } else {
          showToast(
            'error',
            response?.message || 'Unable to update username. Please try again later.'
          );
        }
      } else {
        showToast('error', 'Username already exists');
      }
    },
  });

  useEffect(() => {
    formik.setValues({
      username: user?.userName || '',
      newUsername: '',
    });
  }, [user]);

  return (
    <CollapsableEditLayout
      className="mt-3"
      title="Change Username"
      isWriteMode={isWriteMode}
      setIsWriteMode={setIsWriteMode}
      isEditable={!hasUnlockUserPermissionOnly}
      isEditable={hasEditPermission}
      isDefaultNotExpanded={true}
      handleSubmit={formik.handleSubmit}
    >
@@ -87,7 +82,7 @@ export const EditUsernamePanel = (props: EditUsernameProps) => {
          <Col xs={6}>
            <InputField
              formik={formik}
              name="Username"
              name="username"
              label="Current Username"
              isReadOnly={true}
              isDisabled={true}
 libs/common-ui/package.json 
+
1
−
1

Visualizado
{
  "name": "@uownleasing/common-ui",
  "version": "0.0.372",
  "version": "0.0.374",
  "dependencies": {
    "axios": "0.27.2",
    "date-fns": "2.28.0",

Visão geral 
0
Commits 
8
Pipelines 
2
Alterações 8
Comparar
e
 8 arquivos
+
157
−
137
Arquivos
8
Search (e.g. *.vue) (F)

lay
‎outs‎

au
‎th‎

inde
‎x.tsx‎
+6 -5

no-
‎auth‎

inde
‎x.tsx‎
+39 -0

pa
‎ges‎

ro
‎les‎

inde
‎x.tsx‎
+0 -12

us
‎ers‎

inde
‎x.tsx‎
+47 -40

inde
‎x.tsx‎
+29 -17

packag
‎e.json‎
+1 -1

serv
‎er.js‎
+31 -58

yarn
‎.lock‎
+4 -4

 package.json 
+
1
−
1

Visualizado
@@ -28,7 +28,7 @@
    "@tim-soft/react-spring-web": "^9.0.0-beta.36",
    "@typescript-eslint/eslint-plugin": "5.14.0",
    "@typescript-eslint/parser": "5.14.0",
    "@uownleasing/common-ui": "0.0.359",
    "@uownleasing/common-ui": "0.0.374",
    "@uownleasing/server-utilities": "0.0.23",
    "bootstrap": "^4.6.0",
    "color": "^3.1.3",
 server.js 
+
31
−
58

Visualizado
@@ -29,76 +29,49 @@ const proxy = {
  login: {
    targetUrl: amsURL,
    modifyOnRes: ({req, res, responseBody}) => {
      const PERMISSIONS = responseBody.permissions || {};
      if (PERMISSIONS) {
        // Grants user permission to access the roles and users pages if they have ams permission.
        if (responseBody?.permissions?.access?.ams) {
          // IF USERS HAVE THIS PERMISSION. ONLY GRANT THEM USER PAGE ACCESS.
          if (responseBody?.permissions?.access?.ams_unlock) {
            responseBody.permissions.access.users = true;
          } else {
            responseBody.permissions.access.roles = true;
            responseBody.permissions.access.users = true;
            responseBody.permissions.access.groups = true;
            responseBody.permissions.access.merchants = true;
          }
        } else {
          res.sendStatus(403);
        }
      } else {
        // eslint-disable-next-line no-console
        console.log(
          'NO VALID PERMISSIONS SET. CURRENT PERMISSIONS:',
          PERMISSIONS,
        );
      const access = responseBody?.permissions?.access;

      if (access?.ams) {
        responseBody.permissions.access.roles = true;
        responseBody.permissions.access.users = true;
        responseBody.permissions.access.groups = true;
        responseBody.permissions.access.merchants = true;

        return {
          modifiedReq: req,
          modifiedRes: res,
          modifiedResponseBody: {...responseBody, statusCode: 200},
        };
      }

      if (responseBody?.permissions) {
        return {
          modifiedReq: req,
          modifiedRes: res,
          modifiedResponseBody: {...responseBody, statusCode: 403},
        };
      }

      return {
        modifiedReq: req,
        modifiedRes: res,
        modifiedResponseBody: responseBody,
        modifiedResponseBody: {statusCode: 401},
      };
    },
  },
  logout: {
    targetUrl: amsURL,
  },
  logout: {targetUrl: amsURL},
  authentication: {
    targetUrl: amsURL,
    pathRewrite: {'^authentication': '/authentication'},
  },
  uown: {
    targetUrl: env.API_URL,
    pathRewrite: {'^uown': '/uown'},
  },
  user$: {
    targetUrl: amsURL,
    pathRewrite: {'^user': '/user'},
  },
  'user/**$': {
    targetUrl: amsURL,
    pathRewrite: {'^user/': '/user/'},
  },
  permission: {
    targetUrl: amsURL,
    pathRewrite: {'^permission': '/permission'},
  },
  role$: {
    targetUrl: amsURL,
    pathRewrite: {'^role': '/role'},
  },
  'role/**$': {
    targetUrl: amsURL,
    pathRewrite: {'^role/': '/role/'},
  },
  group$: {
    targetUrl: amsURL,
    pathRewrite: {'^group': '/group'},
  },
  'group/**$': {
    targetUrl: amsURL,
    pathRewrite: {'^group/': '/group/'},
  },
  uown: {targetUrl: env.API_URL, pathRewrite: {'^uown': '/uown'}},
  user$: {targetUrl: amsURL, pathRewrite: {'^user': '/user'}},
  'user/**$': {targetUrl: amsURL, pathRewrite: {'^user/': '/user/'}},
  permission: {targetUrl: amsURL, pathRewrite: {'^permission': '/permission'}},
  role$: {targetUrl: amsURL, pathRewrite: {'^role': '/role'}},
  'role/**$': {targetUrl: amsURL, pathRewrite: {'^role/': '/role/'}},
  group$: {targetUrl: amsURL, pathRewrite: {'^group': '/group'}},
  'group/**$': {targetUrl: amsURL, pathRewrite: {'^group/': '/group/'}},
};

const config = require('./server-config/config')({PRIV_KEY, amsURL, proxy});
 yarn.lock 
+
4
−
4

Visualizado
@@ -1817,10 +1817,10 @@
    "@typescript-eslint/types" "5.14.0"
    eslint-visitor-keys "^3.0.0"

"@uownleasing/common-ui@0.0.359":
  version "0.0.359"
  resolved "https://nexus.uownleasing.com/repository/npm-hosted/@uownleasing/common-ui/-/common-ui-0.0.359.tgz#73e198a38c3c0b6dceee8ac00ebc7e877b3d700f"
  integrity sha512-LwFku2bD3LklqhIEyLZmAoxm7svJFj8QmQEDEdH+SRpry2Ne4jT3ym3XzzrrlZbCgNBR7OGsQazLMzTooDxCGA==
"@uownleasing/common-ui@0.0.374":
  version "0.0.374"
  resolved "https://nexus.uownleasing.com/repository/npm-hosted/@uownleasing/common-ui/-/common-ui-0.0.374.tgz#8670fb8f7ffe5f1de2db85f464df8931d4a23b23"
  integrity sha512-NOq3WjeeIYor5xtyViDb3XHDO4Wxey79CxOMNv4zMSV9uCdNdiqnX42oaq2PIHsSQJifiCmKH0XaGS3cwe8SXA==
  dependencies:
    "@fortawesome/fontawesome-svg-core" "6.1.1"
    "@fortawesome/free-solid-svg-icons" "6.1.1"

Visão geral 
0
Commits 
1
Pipelines 
1
Alterações 1
Comparar
e
 1 arquivo
+
11
−
1
 src/main/java/com/uownleasing/ams/environment/Uown.java 
+
11
−
1

Visualizado
@@ -138,6 +138,8 @@ public class Uown extends EnvironmentService {

                {"ams [access]", "access", "ams", "", ""},
                {"ams unlock user [modify]", "access", "ams_unlock", "", ""},
                {"ams access user panel [access]", "access", "ams_user_panel", "", ""},
                {"ams edit user panel [modify]", "modify", "ams_user_panel/edit", "", ""},
                {"ams modify user", "access", "modify user", "", ""},

                {"pw request affordability", "modify", "customer_information/pw_request_affordability", "", ""},
@@ -326,7 +328,9 @@ public class Uown extends EnvironmentService {
                {"view lead recordings", "restricted/view/full", "recording", "", ""},

                {"ams [access]", "access", "ams", "", ""},
                {"ams unlock user [modify]", "modify", "unlock_user", "", ""},
                {"ams unlock user [modify]", "modify", "ams_unlock", "", ""},
                {"ams access user panel [access]", "access", "ams_user_panel", "", ""},
                {"ams edit user panel [modify]", "modify", "ams_user_panel/edit", "", ""},
                {"ams modify user", "access", "modify_user", "", ""},


@@ -421,6 +425,9 @@ public class Uown extends EnvironmentService {
                    "phone_history [access]",

                    "ams [access]",
                    "ams unlock user [modify]",
                    "ams access user panel [access]",
                    "ams edit user panel [modify]",
                    "pw request affordability",
                    "pw confirm allocation",
                    "send review",
@@ -692,6 +699,9 @@ public class Uown extends EnvironmentService {
                    "add lease",

                    "ams [access]",
                    "ams unlock user [modify]",
                    "ams access user panel [access]",
                    "ams edit user panel [modify]",

                    "rebate [access]",
                    "get merchant rebate amount",

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


> ## Tests in stg
> ```gherkin
>
> ### Scenario: Granting permission in Origination also applies to Servicing
> Given I grant the "ams unlock user" permission to user in the Origination area
> When I check the permissions in the Servicing area
> Then user should also have the "ams unlock user" permission in Servicing
>
>
>
> ### Scenario: Revoking permission in Servicing also applies to Origination
> Given I revoke the "ams edit user panel" permission from user in the Servicing area
> When I check the permissions in the Origination area
> Then user should no longer have the "ams edit user panel" permission in Origination
> | PASS |
> ```
>
>
>
The tests validate that only users with the correct permissions can unlock users and edit panels, that these permissions are inherited by the Manager and Administrator roles by default, and that when permissions are changed in one area (Origination/Maintenance), the change also affects the other.
>
>
>



### Scenario: Conceder permissão em Origination também se aplica a Servicing
Dado que concedo a permissão "ams unlock user" para o usuário "operational" na área de Origination
Quando verifico as permissões de "operational" na área de Servicing
Então o usuário também deve ter a permissão "ams unlock user" em Servicing



### Cenário: Revogar permissão em Servicing também se aplica a Origination
Dado que revogo a permissão "ams edit user panel" do usuário "tester" na área de Servicing
Quando verifico as permissões de "tester" na área de Origination
Então "tester" não deve mais ter a permissão "ams edit user panel" em Origination
| PASS |



### Cenário: Revogar a permissão "ams edit user" em Servicing também remove em Origination
Dado que revogo a permissão "ams edit user" de um usuário na área de Servicing
Quando verifico as permissões desse usuário na área de Origination
Então o usuário não deve mais ter a permissão "ams edit user" em Origination
E se o usuário tiver a permissão "ams edit user", ele pode editar usuários
E se o usuário não tiver a permissão "ams edit user", ele não pode editar usuários


> ## Tests in stg
> ```gherkin
>
> ### Scenario: Granting permission in Origination also applies to Servicing
> Given I grant the "ams unlock user" permission to user in the Origination area
> When I check the permissions in the Servicing area
> Then user should also have the "ams unlock user" permission in Servicing
>
>
![Screenshot_20](/uploads/45ecec0edbce6af96ebeb25cbcdf4677/Screenshot_20.png){width=208 height=99}

![Screenshot_21](/uploads/8307353a62b68021166d0301fefed81c/Screenshot_21.png){width=420 height=88}

![Screenshot_22](/uploads/614c02576b3e0ef620d4573fe29a5452/Screenshot_22.png){width=216 height=96}

![Screenshot_23](/uploads/a595484e52f3d2130ed77674a97762bf/Screenshot_23.png){width=639 height=227}
>
>
>
> ```gherkin
>
> ### Scenario: Revoking permission in Servicing also applies to Origination
> Given I revoke the "ams edit user panel" permission from user in the Servicing area
> When I check the permissions in the Origination area
> Then user should no longer have the "ams edit user panel" permission in Origination
> | PASS |
> ```
>
>
![Screenshot_16](/uploads/76a91965ddfa5b85e2ff4099220bc3ea/Screenshot_16.png){width=237 height=108}

![Screenshot_17](/uploads/e602eb96732b7396b6d2b22e32b25883/Screenshot_17.png){width=263 height=195}

![Screenshot_18](/uploads/44e35f6d8f9f0f5c40600015b899339d/Screenshot_18.png){width=256 height=110}

![Screenshot_19](/uploads/97def37c87df4df4e2304f9be62df1dd/Screenshot_19.png){width=429 height=102}


The tests validate that only users with the correct permissions can unlock users and edit panels, that these permissions are inherited by the Manager and Administrator roles by default, and that when permissions are changed in one area (Origination/Maintenance), the change also affects the other.
>
>
>

> ```gherkin
>
> ### Scenario: Revoking the "ams edit user" permission in Servicing also removes it in Origination
> Given I revoke the "ams edit user" permission from a user in the Servicing area
> When I check that user's permissions in the Origination area
> Then the user should no longer have the "ams edit user" permission in Origination
> And if the user has the "ams edit user" permission, they can edit users
> And if the user does not have the "ams edit user" permission, they cannot edit users
> | PASS |
> ```
>
>
![Screenshot_11](/uploads/ff51f593eddb4d4270606051ae63da5d/Screenshot_11.png){width=1439 height=745}

![Screenshot_12](/uploads/b217030b101ce53defe02e5744e15b08/Screenshot_12.png){width=1439 height=745}

![Screenshot_14](/uploads/5564cb0d8b6439fc22b3d2222673e458/Screenshot_14.png){width=255 height=87}

![Screenshot_13](/uploads/b84bbdc7a44336ea0bf8ae75ac59748e/Screenshot_13.png){width=1439 height=745}

![Screenshot_15](/uploads/8932ab429eacee9cf4cf18edb25375c3/Screenshot_15.png){width=1426 height=722}

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in stg

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------